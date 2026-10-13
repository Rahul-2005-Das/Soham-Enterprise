import { z } from 'zod';

export const customerLocationCoordinatesSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

export type CustomerLocationCoordinates = z.infer<typeof customerLocationCoordinatesSchema>;
