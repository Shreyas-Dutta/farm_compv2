from __future__ import annotations

import argparse
import json
import random
import shutil
import subprocess
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import tensorflow as tf


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
DATASET_REPO = "https://github.com/spMohanty/PlantVillage-Dataset.git"

CROP_NAME_MAP = {
    "Apple": "Apple",
    "Blueberry": "Blueberry",
    "Cherry_(including_sour)": "Cherry",
    "Corn_(maize)": "Maize",
    "Grape": "Grape",
    "Orange": "Orange",
    "Peach": "Peach",
    "Pepper,_bell": "Bell Pepper",
    "Potato": "Potato",
    "Raspberry": "Raspberry",
    "Soybean": "Soybean",
    "Squash": "Squash",
    "Strawberry": "Strawberry",
    "Tomato": "Tomato",
}

DISEASE_NAME_MAP = {
    "healthy": "Healthy",
    "Apple_scab": "Apple Scab",
    "Black_rot": "Black Rot",
    "Cedar_apple_rust": "Cedar Apple Rust",
    "Powdery_mildew": "Powdery Mildew",
    "Cercospora_leaf_spot Gray_leaf_spot": "Cercospora Leaf Spot",
    "Common_rust_": "Common Rust",
    "Northern_Leaf_Blight": "Northern Leaf Blight",
    "Esca_(Black_Measles)": "Esca (Black Measles)",
    "Leaf_blight_(Isariopsis_Leaf_Spot)": "Leaf Blight (Isariopsis Leaf Spot)",
    "Haunglongbing_(Citrus_greening)": "Huanglongbing (Citrus Greening)",
    "Bacterial_spot": "Bacterial Spot",
    "Early_blight": "Early Blight",
    "Late_blight": "Late Blight",
    "Leaf_Mold": "Leaf Mold",
    "Septoria_leaf_spot": "Septoria Leaf Spot",
    "Spider_mites Two-spotted_spider_mite": "Spider Mites (Two-spotted Spider Mite)",
    "Target_Spot": "Target Spot",
    "Tomato_mosaic_virus": "Tomato Mosaic Virus",
    "Tomato_Yellow_Leaf_Curl_Virus": "Tomato Yellow Leaf Curl Virus",
    "Leaf_scorch": "Leaf Scorch",
}


@dataclass(frozen=True)
class PlantClassInfo:
    label: str
    crop_name: str
    disease: str | None
    disease_hi: str | None
    status: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train and export a PlantVillage multiclass TFJS disease-identification model.")
    parser.add_argument("--dataset-dir", default=".cache/plant-health/PlantVillage-Dataset", help="PlantVillage dataset checkout directory.")
    parser.add_argument("--output-dir", default="public/models/plant-health", help="Output directory for browser model artifacts.")
    parser.add_argument("--max-per-class", type=int, default=300, help="Max images to sample from each PlantVillage class folder.")
    parser.add_argument("--image-size", type=int, default=128, help="Square resize dimension for training and inference.")
    parser.add_argument("--batch-size", type=int, default=32, help="Training batch size.")
    parser.add_argument("--epochs", type=int, default=10, help="Training epochs.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument("--healthy-threshold", type=float, default=0.7, help="Healthy top-class confidence threshold for runtime inference.")
    parser.add_argument("--diseased-threshold", type=float, default=0.5, help="Diseased top-class confidence threshold for runtime inference.")
    parser.add_argument("--min-confidence-margin", type=float, default=0.15, help="Minimum top-1 vs top-2 probability margin before the runtime trusts a multiclass prediction.")
    return parser.parse_args()


def ensure_dataset_checkout(dataset_dir: Path) -> None:
    if dataset_dir.exists() and any(dataset_dir.iterdir()):
        return

    dataset_dir.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["git", "clone", "--depth", "1", DATASET_REPO, str(dataset_dir)], check=True)


def has_images(path: Path) -> bool:
    return any(file.suffix.lower() in IMAGE_EXTENSIONS for file in path.rglob("*"))


def to_title_case(value: str) -> str:
    return " ".join(word[:1].upper() + word[1:] for word in value.split())


def humanize_label_part(value: str) -> str:
    normalized = (
        value.replace("_", " ")
        .replace(",", " ")
        .replace("(", " ")
        .replace(")", " ")
        .strip()
        .lower()
    )
    return to_title_case(" ".join(normalized.split()))


def humanize_crop_name(raw_crop_name: str) -> str:
    return CROP_NAME_MAP.get(raw_crop_name, humanize_label_part(raw_crop_name))


def humanize_disease_name(raw_disease_name: str) -> str:
    return DISEASE_NAME_MAP.get(raw_disease_name, humanize_label_part(raw_disease_name))


def parse_class_info(class_dir_name: str) -> PlantClassInfo | None:
    normalized = class_dir_name.strip()
    if "___" not in normalized:
        return None

    raw_crop_name, raw_disease_name = normalized.split("___", 1)
    status = "healthy" if raw_disease_name.strip().lower() == "healthy" else "diseased"
    disease = None if status == "healthy" else humanize_disease_name(raw_disease_name)
    return PlantClassInfo(
        label=normalized,
        crop_name=humanize_crop_name(raw_crop_name),
        disease=disease,
        disease_hi=disease,
        status=status,
    )


def get_class_dirs(path: Path) -> list[Path]:
    return [child for child in path.iterdir() if child.is_dir() and any(file.suffix.lower() in IMAGE_EXTENSIONS for file in child.iterdir())]


def get_class_dir_infos(path: Path) -> list[tuple[Path, PlantClassInfo]]:
    infos: list[tuple[Path, PlantClassInfo]] = []
    for class_dir in sorted(get_class_dirs(path), key=lambda item: item.name.lower()):
        class_info = parse_class_info(class_dir.name)
        if class_info is not None:
            infos.append((class_dir, class_info))
    return infos


def find_image_root(dataset_dir: Path) -> Path:
    preferred_color_root = dataset_dir / "raw" / "color"
    if preferred_color_root.is_dir() and get_class_dir_infos(preferred_color_root):
        return preferred_color_root

    candidates = [dataset_dir]
    for child in dataset_dir.iterdir():
        if child.is_dir():
            candidates.append(child)
            candidates.extend(grandchild for grandchild in child.iterdir() if grandchild.is_dir())

    best_candidate = None
    best_score = (-1, -1, -1)
    for candidate in candidates:
        if not candidate.exists() or not candidate.is_dir() or not has_images(candidate):
            continue
        class_dir_infos = get_class_dir_infos(candidate)
        healthy_classes = sum(1 for _, class_info in class_dir_infos if class_info.status == "healthy")
        diseased_classes = sum(1 for _, class_info in class_dir_infos if class_info.status == "diseased")
        score = (
            1 if healthy_classes > 0 and diseased_classes > 0 else 0,
            min(healthy_classes, diseased_classes),
            len(class_dir_infos),
        )
        if score > best_score:
            best_candidate = candidate
            best_score = score

    if not best_candidate:
        raise FileNotFoundError(f"Could not find image folders in {dataset_dir}")

    return best_candidate


def collect_records(class_dir_infos: list[tuple[Path, PlantClassInfo]], seed: int, max_per_class: int) -> list[tuple[str, int]]:
    rng = random.Random(seed)
    records: list[tuple[str, int]] = []

    for class_index, (class_dir, _class_info) in enumerate(class_dir_infos):
        files = [file for file in class_dir.iterdir() if file.suffix.lower() in IMAGE_EXTENSIONS]
        rng.shuffle(files)
        sampled = files[: max_per_class or len(files)]
        records.extend((str(file), class_index) for file in sampled)

    rng.shuffle(records)
    return records


def split_records(records: list[tuple[str, int]], seed: int) -> tuple[list[tuple[str, int]], list[tuple[str, int]], list[tuple[str, int]]]:
    rng = random.Random(seed)
    by_label: dict[int, list[tuple[str, int]]] = {}
    for record in records:
        by_label.setdefault(record[1], []).append(record)

    if len(by_label) < 2:
        raise ValueError(f"Need at least two classes before creating splits. Collected {len(by_label)} classes.")

    train_records: list[tuple[str, int]] = []
    val_records: list[tuple[str, int]] = []
    test_records: list[tuple[str, int]] = []

    for label_records in by_label.values():
        rng.shuffle(label_records)
        total = len(label_records)
        test_count = max(1, int(total * 0.15)) if total >= 8 else (1 if total >= 4 else 0)
        val_count = max(1, int(total * 0.15)) if total >= 8 else (1 if total >= 5 else 0)
        if test_count + val_count >= total:
            test_count = 1 if total >= 3 else 0
            val_count = 1 if total >= 4 else 0
        train_count = total - val_count - test_count
        if train_count <= 0:
            raise ValueError(f"Not enough samples collected to split class with total={total}.")

        train_records.extend(label_records[:train_count])
        val_records.extend(label_records[train_count:train_count + val_count])
        test_records.extend(label_records[train_count + val_count:])

    rng.shuffle(train_records)
    rng.shuffle(val_records)
    rng.shuffle(test_records)
    return train_records, val_records, test_records


def build_dataset(records: list[tuple[str, int]], image_size: int, batch_size: int, training: bool) -> tf.data.Dataset:
    paths = [record[0] for record in records]
    labels = [record[1] for record in records]
    dataset = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        dataset = dataset.shuffle(len(records), seed=42, reshuffle_each_iteration=True)

    def load_image(path: tf.Tensor, label: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
        image_bytes = tf.io.read_file(path)
        image = tf.io.decode_image(image_bytes, channels=3, expand_animations=False)
        image = tf.image.resize(image, [image_size, image_size])
        image = tf.cast(image, tf.float32) / 255.0
        if training:
            image = tf.image.random_flip_left_right(image)
        label = tf.cast(label, tf.int32)
        return image, label

    return dataset.map(load_image, num_parallel_calls=tf.data.AUTOTUNE).batch(batch_size).prefetch(tf.data.AUTOTUNE)


def build_model(image_size: int, class_count: int) -> tf.keras.Model:
    inputs = tf.keras.Input(shape=(image_size, image_size, 3), name="image")
    x = tf.keras.layers.Conv2D(32, 3, padding="same", activation="relu", name="conv_1")(inputs)
    x = tf.keras.layers.MaxPooling2D(name="pool_1")(x)
    x = tf.keras.layers.SeparableConv2D(64, 3, padding="same", activation="relu", name="conv_2")(x)
    x = tf.keras.layers.MaxPooling2D(name="pool_2")(x)
    x = tf.keras.layers.SeparableConv2D(128, 3, padding="same", activation="relu", name="conv_3")(x)
    x = tf.keras.layers.MaxPooling2D(name="pool_3")(x)
    x = tf.keras.layers.SeparableConv2D(192, 3, padding="same", activation="relu", name="conv_4")(x)
    x = tf.keras.layers.MaxPooling2D(name="pool_4")(x)
    x = tf.keras.layers.GlobalAveragePooling2D(name="global_pool")(x)
    x = tf.keras.layers.Dropout(0.25, name="dropout")(x)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax", name="class_probabilities")(x)
    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="plant_health_classifier")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=5e-4),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=[
            tf.keras.metrics.SparseCategoricalAccuracy(name="accuracy"),
            tf.keras.metrics.SparseTopKCategoricalAccuracy(k=min(3, class_count), name="top_3_accuracy"),
        ],
    )
    return model


def get_keras_history_reference(value: object) -> list[object] | None:
    if not isinstance(value, dict) or value.get("class_name") != "__keras_tensor__":
        return None

    config = value.get("config") or {}
    history = config.get("keras_history")
    if not isinstance(history, list) or len(history) < 3:
        return None

    return [history[0], history[1], history[2], {}]


def extract_keras_history_references(args: object) -> list[list[object]]:
    reference = get_keras_history_reference(args)
    if reference is not None:
        return [reference]

    if isinstance(args, list):
        references: list[list[object]] = []
        for item in args:
            references.extend(extract_keras_history_references(item))
        return references

    return []


def normalize_tfjs_value(value: object) -> object:
    dtype_policy_name = None
    if isinstance(value, dict):
        if value.get("class_name") == "DTypePolicy":
            config = value.get("config") or {}
            dtype_policy_name = config.get("name")
            return dtype_policy_name or "float32"

        normalized: dict[str, object] = {}
        for key, item in value.items():
            if key in {"module", "registered_name", "build_config", "compile_config"}:
                continue

            normalized_key = "batch_input_shape" if key in {"batch_shape", "batchInputShape"} else key
            normalized[normalized_key] = normalize_tfjs_value(item)
        return normalized

    if isinstance(value, list):
        return [normalize_tfjs_value(item) for item in value]

    return value


def normalize_tfjs_inbound_nodes(inbound_nodes: object) -> list[object]:
    if not isinstance(inbound_nodes, list):
        return []

    normalized_nodes: list[object] = []
    for node in inbound_nodes:
        if isinstance(node, dict):
            references = extract_keras_history_references(node.get("args", []))
            if references:
                normalized_nodes.append(references)
            continue

        normalized_nodes.append(normalize_tfjs_value(node))

    return normalized_nodes


def normalize_tfjs_layer(layer: dict[str, object]) -> dict[str, object]:
    config = normalize_tfjs_value(layer.get("config") or {})
    if not isinstance(config, dict):
        config = {}

    class_name = layer.get("class_name")
    if class_name == "InputLayer":
        config.pop("ragged", None)
        config.pop("optional", None)

    return {
        "name": layer.get("name") or config.get("name"),
        "class_name": class_name,
        "config": config,
        "inbound_nodes": normalize_tfjs_inbound_nodes(layer.get("inbound_nodes") or []),
    }


def normalize_tfjs_model_topology(model_topology: dict[str, object]) -> dict[str, object]:
    normalized_topology = normalize_tfjs_value(model_topology)
    if not isinstance(normalized_topology, dict):
        raise TypeError("Model topology must normalize to a dictionary.")

    config = normalized_topology.get("config") or {}
    if not isinstance(config, dict):
        raise TypeError("Model topology config must be a dictionary.")

    layers = config.get("layers") or []
    if not isinstance(layers, list):
        raise TypeError("Model topology layers must be a list.")

    config["layers"] = [normalize_tfjs_layer(layer) for layer in layers if isinstance(layer, dict)]

    for key in ("input_layers", "output_layers"):
        value = config.get(key)
        if isinstance(value, list) and value and not isinstance(value[0], list):
            config[key] = [value]

    return {
        "class_name": "Model" if normalized_topology.get("class_name") == "Functional" else normalized_topology.get("class_name"),
        "config": config,
        "keras_version": tf.keras.__version__,
        "backend": "tensorflow",
    }


def normalize_weight_name(model_name: str, raw_name: str) -> str:
    normalized = raw_name.replace(":0", "")
    prefix = f"{model_name}/"
    return normalized[len(prefix):] if normalized.startswith(prefix) else normalized


def export_tfjs_layers_model(model: tf.keras.Model, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    topology = normalize_tfjs_model_topology(json.loads(model.to_json()))
    weights = []
    weight_bytes = bytearray()

    for weight in model.weights:
        weight_array = weight.numpy().astype(np.float32)
        weight_name = normalize_weight_name(model.name, getattr(weight, "path", weight.name))
        weights.append({
            "name": weight_name,
            "shape": list(weight_array.shape),
            "dtype": "float32",
        })
        weight_bytes.extend(weight_array.tobytes(order="C"))

    model_json = {
        "format": "layers-model",
        "generatedBy": f"keras v{tf.keras.__version__}",
        "convertedBy": "farm-companion custom exporter",
        "modelTopology": topology,
        "weightsManifest": [{
            "paths": ["weights.bin"],
            "weights": weights,
        }],
    }

    (output_dir / "model.json").write_text(json.dumps(model_json), encoding="utf-8")
    (output_dir / "weights.bin").write_bytes(weight_bytes)


def main() -> None:
    args = parse_args()
    random.seed(args.seed)
    np.random.seed(args.seed)
    tf.random.set_seed(args.seed)

    dataset_dir = Path(args.dataset_dir)
    output_dir = Path(args.output_dir)
    ensure_dataset_checkout(dataset_dir)
    image_root = find_image_root(dataset_dir)
    class_dir_infos = get_class_dir_infos(image_root)
    class_infos = [class_info for _, class_info in class_dir_infos]

    if len(class_infos) < 2:
        raise ValueError(f"Need at least two PlantVillage classes to train a multiclass model, found {len(class_infos)}.")

    records = collect_records(class_dir_infos, args.seed, args.max_per_class)
    class_sample_counts = Counter(class_infos[label].label for _, label in records)
    status_sample_counts = Counter(class_infos[label].status for _, label in records)
    print(f"Using PlantVillage image root: {image_root}")
    print(
        "Collected samples: "
        f"healthy={status_sample_counts.get('healthy', 0)} diseased={status_sample_counts.get('diseased', 0)} total={len(records)} classes={len(class_infos)}"
    )
    if len(records) < max(80, len(class_infos) * 4):
        raise ValueError("Collected too few images to train a useful multiclass model.")

    train_records, val_records, test_records = split_records(records, args.seed)
    train_dataset = build_dataset(train_records, args.image_size, args.batch_size, training=True)
    val_dataset = build_dataset(val_records, args.image_size, args.batch_size, training=False)
    test_dataset = build_dataset(test_records, args.image_size, args.batch_size, training=False)

    model = build_model(args.image_size, len(class_infos))
    callbacks = [
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=1, min_lr=1e-5, verbose=1),
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=3, mode="min", restore_best_weights=True),
    ]
    history = model.fit(train_dataset, validation_data=val_dataset, epochs=args.epochs, callbacks=callbacks, verbose=2)
    evaluation = model.evaluate(test_dataset, return_dict=True, verbose=0)

    if output_dir.exists():
        shutil.rmtree(output_dir)
    export_tfjs_layers_model(model, output_dir)

    metadata = {
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "datasetDir": str(dataset_dir),
        "imageRoot": str(image_root),
        "imageSize": args.image_size,
        "labels": [class_info.label for class_info in class_infos],
        "classes": [
            {
                "label": class_info.label,
                "cropName": class_info.crop_name,
                "disease": class_info.disease,
                "diseaseHi": class_info.disease_hi,
                "status": class_info.status,
            }
            for class_info in class_infos
        ],
        "healthyThreshold": args.healthy_threshold,
        "diseasedThreshold": args.diseased_threshold,
        "minConfidenceMargin": args.min_confidence_margin,
        "sampleCounts": {
            "all": len(records),
            "train": len(train_records),
            "validation": len(val_records),
            "test": len(test_records),
            "byStatus": {
                "healthy": status_sample_counts.get("healthy", 0),
                "diseased": status_sample_counts.get("diseased", 0),
            },
            "byClass": dict(sorted(class_sample_counts.items())),
        },
        "metrics": {key: float(value) for key, value in evaluation.items()},
        "history": {key: [float(item) for item in values] for key, values in history.history.items()},
        "runtime": {
            "input": "rgb_uint8_scaled_0_1",
            "output": "softmax_class_probabilities",
        },
    }
    (output_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()