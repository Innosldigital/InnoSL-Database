import { notFound } from "next/navigation";
import { getPersonById } from "@/lib/queries";
import { BackButton } from "@/components/shared/BackButton";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonEditForm } from "@/components/people/PersonEditForm";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const person = await getPersonById(params.id);
    return { title: `Edit ${person?.full_name ?? "Person"}` };
  } catch {
    return { title: "Edit Person" };
  }
}

export default async function EditPersonPage({ params }: { params: { id: string } }) {
  let person;
  try {
    person = await getPersonById(params.id);
  } catch {
    notFound();
  }

  if (!person) notFound();

  return (
    <div className="flex flex-col gap-4">
      <BackButton href={`/people/${person.person_id}`} label="Person profile" ref={person.isl_ref} />
      <PageHeader
        title="Edit profile"
        subtitle={`Update core person details for ${person.full_name}`}
      />
      <PersonEditForm person={person} />
    </div>
  );
}
