import { notFound }        from "next/navigation";
import { getPersonById }   from "@/lib/queries";
import { PersonHero }      from "@/components/people/PersonHero";
import { PersonTimeline }  from "@/components/people/PersonTimeline";
import { PersonBusinesses } from "@/components/people/PersonBusinesses";
import { PersonDocuments } from "@/components/people/PersonDocuments";
import { PersonContact }   from "@/components/people/PersonContact";
import { PersonEquity }    from "@/components/people/PersonEquity";
import { PersonScore }     from "@/components/people/PersonScore";
import { PersonKPIs }      from "@/components/people/PersonKPIs";
import { BackButton }      from "@/components/shared/BackButton";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const person = await getPersonById(params.id);
    return { title: person?.full_name ?? "Person Profile" };
  } catch {
    return { title: "Person Profile" };
  }
}

export default async function PersonProfilePage({ params }: { params: { id: string } }) {
  let person;
  try {
    person = await getPersonById(params.id);
  } catch {
    notFound();
  }
  if (!person) notFound();

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/people" label="People" ref={person.isl_ref} />

      <PersonHero person={person} />

      <PersonKPIs person={person} />

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col gap-4">
          <PersonTimeline person={person} />
          <PersonBusinesses person={person} />
          <PersonDocuments person={person} />
        </div>
        <div className="flex flex-col gap-4">
          <PersonContact person={person} />
          <PersonEquity person={person} />
          <PersonScore person={person} />
        </div>
      </div>
    </div>
  );
}
