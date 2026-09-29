const { Card, CardRow, Badge, Button, Icon, Avatar, Input, Checkbox, Modal, Alert } = window.AewebDesignSystem_20be84;
const USERS = [
  { n: 'Anna Keller', m: 'a.keller@muster.ch', r: ['Admin', 'secondary', 'solid'] },
  { n: 'Marco Brunner', m: 'm.brunner@muster.ch', r: ['Redaktion', 'primary', 'tint'] },
  { n: 'Lea Frei', m: 'l.frei@muster.ch', r: ['Eingeladen', 'warning', 'tint'] },
  { n: 'Jonas Meier', m: 'j.meier@muster.ch', r: ['Extern', 'danger', 'tint'] },
];
function Stat({ label, value, badge }) {
  return <Card padding="compact" style={{ padding: '16px 24px' }}><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)' }}>{label}</div><div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}><span style={{ fontSize: 30, fontWeight: 700 }}>{value}</span>{badge}</div></Card>;
}
function Dashboard({ openUser }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 24 }}>
        <Stat label="Aktive Benutzer" value="48" badge={<Badge color="success">+4</Badge>} />
        <Stat label="Offene Einladungen" value="6" />
        <Stat label="Dokumente" value="1'204" badge={<Badge color="primary">3 neu</Badge>} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }}>
        <UserList openUser={openUser} limit={3} />
        <Card title="Hinweise">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Alert tone="info">2 Benutzer haben ihre E-Mail noch nicht bestätigt.</Alert>
            <Alert tone="success">Backup erfolgreich um 03:00 Uhr.</Alert>
          </div>
        </Card>
      </div>
    </>
  );
}
function UserList({ openUser, limit }) {
  const list = limit ? USERS.slice(0, limit) : USERS;
  return (
    <Card title="Benutzer" subtitle={USERS.length + ' Konten'} actions={<Button variant="secondary" icon={<Icon name="plus" size={16} />} onClick={() => openUser(null)}>Einladen</Button>}>
      {list.map(u => <CardRow key={u.n} onClick={() => openUser(u)} leading={<Avatar name={u.n} size={40} />} title={u.n} meta={u.m} trailing={<><Badge color={u.r[1]} variant={u.r[2]}>{u.r[0]}</Badge><Icon name="chevron-right" size={18} style={{ color: 'var(--color-text-muted)' }} /></>} />)}
    </Card>
  );
}
function Settings() {
  return (
    <Card title="Profil" style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}><Input label="Vorname" defaultValue="Anna" /><Input label="Nachname" defaultValue="Keller" /></div>
        <Input label="E-Mail" defaultValue="a.keller@muster.ch" hint="Wird für die Anmeldung verwendet" />
        <hr className="ae-divider ae-divider--dashed" style={{ margin: 0 }} />
        <Checkbox label="E-Mail-Benachrichtigungen" defaultChecked />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}><Button variant="tertiary">Abbrechen</Button><Button size="md">Speichern</Button></div>
      </div>
    </Card>
  );
}
function Empty({ label }) {
  return <Card><p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{label} — in diesem UI-Kit bewusst leer gelassen.</p></Card>;
}
function UserModal({ user, onClose }) {
  const [tab, setTab] = React.useState('allg');
  const [first, last] = user ? user.n.split(' ') : ['', ''];
  return (
    <Modal title={user ? 'Benutzer bearbeiten' : 'Benutzer einladen'} onClose={onClose} tabs={[{ id: 'allg', label: 'Allgemein' }, { id: 'rechte', label: 'Rechte' }]} tab={tab} onTabChange={setTab}
      footer={<><Button variant="tertiary" onClick={onClose}>Schliessen</Button><Button size="md" onClick={onClose}>{user ? 'Speichern' : 'Einladen'}</Button></>}>
      {tab === 'allg' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><Input label="Vorname" defaultValue={first} /><Input label="Nachname" defaultValue={last} /></div>
          <Input label="E-Mail" defaultValue={user ? user.m : ''} placeholder="name@firma.ch" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Checkbox label="Benutzer verwalten" defaultChecked /><Checkbox label="Dokumente bearbeiten" defaultChecked /><Checkbox label="Rechnungen einsehen" />
        </div>
      )}
    </Modal>
  );
}
Object.assign(window, { Dashboard, UserList, Settings, Empty, UserModal });
