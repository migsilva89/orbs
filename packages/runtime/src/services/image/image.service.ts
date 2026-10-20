import { createNodePhotonImages } from '@earendil-works/pi-durable/images/node';

/** Native image processing for Pi's `read` tool: Photon shrinks and converts images to the model's limits. */
export function makeImageService() {
  return createNodePhotonImages();
}
