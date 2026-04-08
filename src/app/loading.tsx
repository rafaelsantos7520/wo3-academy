import { LogoMark } from "@/components/logo-mark";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#10263b_0%,#09111b_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="rounded-4xl border border-white/10 bg-white/5 p-10 text-center">
          <div className="mx-auto w-fit">
            <LogoMark />
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Carregando plataforma</h1>
          <p className="mt-3 text-white/70">Preparando o conteúdo para você...</p>
        </div>
      </div>
    </main>
  );
}
