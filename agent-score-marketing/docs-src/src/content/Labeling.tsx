import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import labelingReviewQueue from "../assets/labeling-review-queue.png";

export default function Labeling() {
  return (
    <>
      <Eyebrow>The Scoring Journey</Eyebrow>
      <h1>Labeling</h1>
      <Dek>
        Automated evals get you most of the way there. The <strong>Labeling</strong> tab is where
        a human weighs in - marking whether an agent's response was actually correct, and turning
        that judgment into evidence Agent Score can use.
      </Dek>

      <h2>Labeling readiness</h2>
      <p>
        An agent's <strong>Labeling</strong> tab opens with its readiness for human review and how
        many labels have been saved so far. Below that, the <strong>review queue</strong> surfaces
        captured interactions one at a time: you choose whether the response was correct, and can
        optionally add the expectation you were checking against - that expectation becomes
        reference evidence for future scoring, not just a one-off note.
      </p>
      <Screenshot
        src={labelingReviewQueue}
        alt="The Labeling tab, showing Labeling readiness (Ready for human review, 0 labels saved) and a Review queue section reading 'No interactions to review' with a Refresh button"
        caption="The Labeling tab - readiness and label count at the top, the review queue below. Refresh checks for newly captured interactions to review."
      />

      <h2>Why label at all</h2>
      <p>
        Evals are strong at catching patterns they were built to catch, but some judgments -
        whether a response was actually right for this specific customer, this specific order -
        need a person who knows the domain. Labeling gives that judgment a place to live
        alongside the automated evidence, instead of staying stuck in someone's head.
      </p>

      <Callout kind="note" title="An empty queue isn't a problem">
        <p>
          If the review queue has nothing in it, it means every currently captured interaction has
          already been reviewed (or none are queued yet) - not that labeling is broken.{" "}
          <strong>Refresh</strong> checks for anything newly captured since you last looked.
        </p>
      </Callout>
    </>
  );
}
