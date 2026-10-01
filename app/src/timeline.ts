export type SceneId =
  | 'name'
  | 'before-word'
  | 'help'
  | 'share'
  | 'comfort'
  | 'truth'
  | 'emergence'
  | 'reveal'
  | 'not-magic'
  | 'verbs'
  | 'failure'
  | 'rediscovery'
  | 'why'
  | 'return'
  | 'beautiful';

export interface TimelineEntry {
  id: SceneId;
  lyricAnchor: string;
}

export const timeline: TimelineEntry[] = [
  { id: 'name', lyricAnchor: 'Nobody invented kindness' },
  { id: 'before-word', lyricAnchor: 'kindness was already there' },
  { id: 'help', lyricAnchor: 'helps another person' },
  { id: 'share', lyricAnchor: 'shares their food' },
  { id: 'comfort', lyricAnchor: 'comforts a friend' },
  { id: 'truth', lyricAnchor: 'tells the truth' },
  { id: 'emergence', lyricAnchor: 'something special happens' },
  { id: 'reveal', lyricAnchor: 'That is kindness' },
  { id: 'not-magic', lyricAnchor: 'It is not magic' },
  { id: 'verbs', lyricAnchor: 'Sometimes kindness means sharing' },
  { id: 'failure', lyricAnchor: 'does not always win right away' },
  { id: 'rediscovery', lyricAnchor: 'keep discovering kindness' },
  { id: 'why', lyricAnchor: 'helps us stay together' },
  { id: 'return', lyricAnchor: 'We did not invent kindness' },
  { id: 'beautiful', lyricAnchor: 'something beautiful' }
];
