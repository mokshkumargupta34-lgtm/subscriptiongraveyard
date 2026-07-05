export type SubStatus = "active" | "buried";

export interface Subscription {
  id: string;
  name: string;
  since: string;
  monthly: number | null;
  lifetime: number;
  lastUsed: string;
  status: SubStatus;
}

export const SUBSCRIPTIONS: Subscription[] = [
  { id: "streamflix", name: "StreamFlix", since: "2019", monthly: 12.99, lifetime: 1247, lastUsed: "unwatched since '24", status: "active" },
  { id: "gymrat", name: "GymRat+", since: "2021", monthly: 29.0, lifetime: 864, lastUsed: "last visit: Jan 2", status: "active" },
  { id: "cloudvault", name: "CloudVault", since: "2018", monthly: 9.99, lifetime: 1032, lastUsed: "2 GB of 2 TB used", status: "active" },
  { id: "vpnghost", name: "VPNGhost", since: "2019", monthly: 6.99, lifetime: 840, lastUsed: "in use · spared", status: "active" },
  { id: "trials", name: "Free Trial ×9", since: "various", monthly: null, lifetime: 389, lastUsed: "forgot to cancel", status: "buried" },
];

export const YEARLY_WASTE = [
  { year: "'21", value: 310 },
  { year: "'22", value: 890 },
  { year: "'23", value: 1540 },
  { year: "'24", value: 2260 },
  { year: "'25", value: 2980 },
  { year: "'26", value: 3532 },
];

export const RENEWALS = [
  { name: "GymRat+", amount: 29.0, inDays: 3 },
  { name: "StreamFlix", amount: 12.99, inDays: 9 },
  { name: "CloudVault", amount: 9.99, inDays: 14 },
  { name: "VPNGhost", amount: 6.99, inDays: 21 },
];

export const ACTIVITY = [
  { icon: "shovel", text: "Buried Free Trial ×9", detail: "saved $389/yr", when: "2h ago" },
  { icon: "scan", text: "Nightly sweep finished", detail: "2,847 receipts parsed", when: "6h ago" },
  { icon: "ghost", text: "New spirit found: VPNGhost", detail: "$6.99/mo since 2019", when: "1d ago" },
  { icon: "bell", text: "Renewal warning: GymRat+", detail: "$29.00 in 3 days", when: "2d ago" },
];
