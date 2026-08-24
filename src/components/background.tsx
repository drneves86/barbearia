export function Background() {
  return (
    <>
      <div aria-hidden className="fixed inset-0 -z-20 bg-ink" />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center opacity-[0.09]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1200&auto=format&fit=crop')",
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center opacity-[0.07]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=1200&auto=format&fit=crop')",
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(212,175,55,0.10), transparent 60%), radial-gradient(900px 500px at 90% 110%, rgba(176,58,46,0.12), transparent 60%), linear-gradient(180deg, rgba(13,13,13,0.35), rgba(13,13,13,0.85) 60%, #0d0d0d)",
        }}
      />
    </>
  );
}
