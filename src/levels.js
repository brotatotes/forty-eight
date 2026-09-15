const node = (id, name, x, y, kind = 'house') => ({ id, name, x, y, kind });
const route = (a, b, type) => ({ a, b, type });
export const levels = [
  {
    id: 'first-light', par: 5, title: 'First light', subtitle: 'A first round in the Little Reach.', startPhase: 0,
    home: 'post', recipients: ['tern', 'bell', 'gull'],
    nodes: [node('post', 'Post office', 19, 68, 'post'), node('tern', 'Tern House', 27, 27), node('bell', 'Bell Tower', 72, 28, 'tower'), node('gull', 'Gull Cottage', 77, 70)],
    edges: [route('post', 'tern', 'bridge'), route('tern', 'bell', 'ferry'), route('bell', 'gull', 'causeway'), route('gull', 'post', 'bridge')],
    note: 'Your first letter is for Tern House. Take the bridge to get started.'
  },
  {
    id: 'two-shores', par: 5, title: 'Two shores', subtitle: 'The long way can be the right way.', startPhase: 3,
    home: 'post', recipients: ['fern', 'light', 'salt'],
    nodes: [node('post', 'Post office', 18, 49, 'post'), node('fern', 'Fern House', 40, 21), node('light', 'The Lantern', 80, 25, 'tower'), node('salt', 'Salt Cottage', 75, 75), node('jetty', 'Old Jetty', 40, 77, 'jetty')],
    edges: [route('post', 'fern', 'causeway'), route('fern', 'light', 'bridge'), route('light', 'salt', 'ferry'), route('salt', 'jetty', 'causeway'), route('jetty', 'post', 'bridge'), route('fern', 'jetty', 'ferry')],
    note: 'Both shores are within reach. Which first crossing puts the tide on your side?'
  },
  {
    id: 'bellwater', par: 6, title: 'Bellwater', subtitle: 'Meet in the middle, leave by the sea.', startPhase: 0,
    home: 'post', recipients: ['bell', 'moss', 'reed'],
    nodes: [node('post', 'Post office', 16, 49, 'post'), node('bell', 'Bell Tower', 44, 20, 'tower'), node('moss', 'Moss Cottage', 82, 30), node('reed', 'Reed House', 74, 77), node('jetty', 'The Crossing', 45, 54, 'jetty')],
    edges: [route('post', 'bell', 'causeway'), route('post', 'jetty', 'bridge'), route('bell', 'moss', 'ferry'), route('bell', 'jetty', 'bridge'), route('jetty', 'moss', 'causeway'), route('moss', 'reed', 'bridge'), route('reed', 'jetty', 'ferry')],
    note: 'The crossing connects both shores. Consider which letter to deliver last.'
  },
  {
    id: 'long-way', par: 7, title: 'The long way round', subtitle: 'Not every shortcut saves a turn.', startPhase: 2,
    home: 'post', recipients: ['rose', 'light', 'pines'],
    nodes: [node('post', 'Post office', 17, 69, 'post'), node('rose', 'Rose Cottage', 20, 25), node('jetty', 'North Jetty', 49, 18, 'jetty'), node('light', 'The Lantern', 81, 30, 'tower'), node('pines', 'Three Pines', 80, 75), node('cove', 'Quiet Cove', 48, 76, 'jetty')],
    edges: [route('post', 'rose', 'bridge'), route('rose', 'jetty', 'causeway'), route('jetty', 'light', 'ferry'), route('light', 'pines', 'bridge'), route('pines', 'cove', 'causeway'), route('cove', 'post', 'ferry'), route('rose', 'cove', 'ferry'), route('jetty', 'cove', 'bridge')],
    note: 'A bridge through the middle may be worth an extra crossing.'
  },
  {
    id: 'window-seat', par: 6, title: 'A window of water', subtitle: 'Catch a ferry, then catch your breath.', startPhase: 0,
    home: 'post', recipients: ['wren', 'salt', 'bell'],
    nodes: [node('post', 'Post office', 17, 50, 'post'), node('wren', 'Wren House', 39, 21), node('salt', 'Salt Cottage', 78, 22), node('bell', 'Bell Tower', 80, 74, 'tower'), node('reed', 'Reed Landing', 43, 78, 'jetty'), node('jetty', 'Midwater', 50, 48, 'jetty')],
    edges: [route('post', 'wren', 'ferry'), route('post', 'reed', 'causeway'), route('wren', 'salt', 'causeway'), route('salt', 'bell', 'ferry'), route('bell', 'reed', 'bridge'), route('reed', 'jetty', 'ferry'), route('wren', 'jetty', 'bridge'), route('jetty', 'salt', 'ferry')],
    note: 'The two shores keep different hours. A well-timed wait can join them.'
  },
  {
    id: 'last-post', par: 7, title: 'The last post', subtitle: 'One last circuit before tea.', startPhase: 0,
    home: 'post', recipients: ['light', 'gull', 'rose'],
    nodes: [node('post', 'Post office', 17, 50, 'post'), node('north', 'North Jetty', 37, 20, 'jetty'), node('light', 'The Lantern', 76, 19, 'tower'), node('gull', 'Gull Cottage', 82, 56), node('south', 'South Jetty', 66, 80, 'jetty'), node('rose', 'Rose Cottage', 28, 79), node('mid', 'The Crossing', 49, 48, 'jetty')],
    edges: [route('post', 'north', 'causeway'), route('north', 'light', 'ferry'), route('light', 'gull', 'causeway'), route('gull', 'south', 'bridge'), route('south', 'rose', 'ferry'), route('rose', 'post', 'bridge'), route('north', 'mid', 'bridge'), route('mid', 'gull', 'ferry'), route('mid', 'rose', 'causeway')],
    note: 'Three letters, many possible routes. Leave yourself a way home.'
  }
];
