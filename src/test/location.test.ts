import { describe, expect, it } from "vitest";

import { formatGoogleGeocodeLocation } from "@/lib/location";

describe("location helpers", () => {
  it("formats Google Maps geocode results into a compact location string", () => {
    const result = formatGoogleGeocodeLocation(
      {
        formatted_address: "Guwahati, Assam, India",
        address_components: [
          { long_name: "Guwahati", types: ["locality"] },
          { long_name: "Assam", types: ["administrative_area_level_1"] },
          { long_name: "India", types: ["country"] },
        ],
      },
      "26.1445, 91.7362"
    );

    expect(result).toBe("Guwahati, Assam, India");
  });
});