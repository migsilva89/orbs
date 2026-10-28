import { lookup } from 'node:dns/promises';
import { BlockList } from 'node:net';
import { LINK } from './link.constants';
import type { LinkResolverPublicParams } from '../../types/link.types';

const linkResolverPrivate = new BlockList();

for (const [network, prefix, family] of LINK.privateSubnets) {
  linkResolverPrivate.addSubnet(network, prefix, family);
}

export async function linkResolverQueryPublic({ hostname }: LinkResolverPublicParams) {
  const addresses = await lookup(hostname, { all: true });

  return addresses.length > 0 && addresses.every(({ address, family }) => !linkResolverPrivate.check(address, family === 6 ? 'ipv6' : 'ipv4'));
}
