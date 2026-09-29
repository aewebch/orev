const { Button, Input, Checkbox, Alert, Icon, Dots } = window.AewebDesignSystem_20be84;
function LoginScreen({ onLogin }) {
  const [err, setErr] = React.useState(false);
  const [slide, setSlide] = React.useState(0);
  const submit = e => { e.preventDefault(); const v = e.target.email.value; if (!v) { setErr(true); return; } onLogin(v); };
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', background: 'var(--color-page-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <form onSubmit={submit} className="ae-card ae-card--even" style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: .5, textTransform: 'uppercase' }}>aeweb</div><h2 style={{ marginTop: 8 }}>Anmelden</h2></div>
          {err ? <Alert tone="danger" title="Anmeldung fehlgeschlagen">Bitte E-Mail-Adresse eingeben.</Alert> : <Alert tone="warning">Wartungsfenster am Sonntag, 02:00–04:00 Uhr.</Alert>}
          <Input name="email" label="E-Mail" type="email" placeholder="name@firma.ch" icon={<Icon name="mail" size={16} />} defaultValue="a.keller@muster.ch" />
          <Input name="pw" label="Passwort" type="password" defaultValue="••••••••" icon={<Icon name="lock" size={16} />} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -8 }}><Checkbox label="Angemeldet bleiben" defaultChecked /><a href="#" style={{ fontSize: 14 }}>Passwort vergessen?</a></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Button type="submit" block>Anmelden</Button>
            <Button type="button" variant="gradient" block lead={<Icon name="key-round" size={20} />} onClick={() => onLogin('partner@muster.ch')}>Mit Partner-Konto anmelden</Button>
          </div>
        </form>
      </div>
      <div style={{ background: 'var(--color-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48, color: '#fff', gap: 24 }}>
        <h1 style={{ maxWidth: 420 }}>{['Alles an einem Ort.', 'Zusammenarbeit ohne Umwege.', 'Sicher in der Schweiz gehostet.'][slide]}</h1>
        <Dots count={3} value={slide} onChange={setSlide} />
      </div>
    </div>
  );
}
window.LoginScreen = LoginScreen;
