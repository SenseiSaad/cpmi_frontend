import { redirect } from "next/navigation";

/** Backend emails link to /learner/learning; CPMI lists courses at /learner/courses. */
export default function Page() {
  redirect("/learner/courses");
}
