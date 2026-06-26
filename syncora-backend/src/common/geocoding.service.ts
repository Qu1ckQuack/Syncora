import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async resolveCoordinates(dto: {
    location?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ lat?: number; lng?: number }> {
    if (dto.location && !dto.latitude && !dto.longitude) {
      const coords = await this.geocodeLocation(dto.location);
      if (coords) return coords;
      this.logger.warn(
        `Could not geocode location for work order: "${dto.location}"`,
      );
    }
    return {};
  }

  private async geocodeLocation(
    location: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Syncora/1.0' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.length === 0) return null;
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (err) {
      this.logger.warn(
        `Nominatim geocoding failed for "${location}": ${err}`,
      );
      return null;
    }
  }
}
