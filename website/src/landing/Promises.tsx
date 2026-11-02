import { Chapter } from "../components/Section";
import classes from "./Promises.module.css";

const PROMISES = ["Nothing uploaded.", "Originals untouched.", "Free, no account."];

export default function Promises() {
  return (
    <Chapter id="promises" tone="white">
      <ul className={classes.list} aria-label="What you can count on">
        {PROMISES.map((promise) => (
          <li key={promise} className={classes.item} data-reveal>
            {promise}
          </li>
        ))}
      </ul>
    </Chapter>
  );
}
