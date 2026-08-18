import { createPerson } from "@/app/actions/people";
import { PersonForm } from "@/components/person-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewPersonPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add person</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonForm action={createPerson} submitLabel="Add person" />
        </CardContent>
      </Card>
    </div>
  );
}
