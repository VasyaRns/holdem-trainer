import { useParams } from "react-router-dom";

export function EmptyTrainPage() {
  const { drillId } = useParams();
  return (
    <section className="space-y-4">
      <h1 className="text-3xl tracking-tight">Тренажёр</h1>
      <p className="text-muted-foreground">
        У «{drillId}» ещё нет вопросов.
      </p>
    </section>
  );
}
