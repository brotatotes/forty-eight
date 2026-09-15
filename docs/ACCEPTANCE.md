# Release acceptance

## Core behavior
- Each of six rounds has exactly three recipients and at most eight nodes, valid unique identifiers, no dangling/duplicate routes and a reachable goal.
- Independent reference solver finds a finite shortest route for every map. Replaying each reference route through the production engine completes at the same length.
- Test every route type in all four tide phases. An illegal move changes nothing. Unknown destinations and malformed actions fail safely.
- Deliver once on arrival, never consume extra turns. Three letters away from home is not complete. Waiting advances one phase and one turn. Undo and restart restore exact position, deliveries, tide and count.
- At least three later rounds provide a real route-order choice with differing completion costs. No requirement to meet par or follow a hint.

## Browser and accessibility
- Opening offers a legal first delivery without setup. Complete a real round, see the postcard, replay it and start another round.
- All six rounds are accessible directly. Switching rounds starts a fresh attempt without carrying over another round’s state.
- Desktop 1440×1000, mobile 390×844 and narrow 320px have no clipped essential controls or horizontal overflow.
- Keyboard-only play reaches a complete round. Focus remains visible after moves, undo and closing help/postcard. Buttons have useful accessible names. Status announces deliveries and tide changes politely, not every decorative rerender.
- Current tide, next phase and route availability are readable without color. Reduced motion and blocked localStorage still allow completion.
- Check console/page errors and unexpected network requests. Test production dist, not only source.

## Reward and delivery
- Postcard contains the real completed route, round name, delivery count and turns. SVG download opens as valid SVG and contains no external references.
- Production build succeeds, unit and browser tests pass after final fixes. Record exact tested commit and build checksum.
- Public source and any live Pages link respond and display the actual tested product. If hosting permission is absent, disclose it and deliver the reproducible archive instead.
- Release archive has deterministic contents and SHA-256. No secrets, host paths, internal logs or private data in public files.
- Presentation has 4–6 slides. A real 60–120-second silent-captioned demo shows at least one delivery, a tide-dependent decision and a visible completed route. Every final link is verified.
