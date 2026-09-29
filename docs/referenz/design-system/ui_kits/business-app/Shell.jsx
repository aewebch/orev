const { NavItem, Icon, Avatar, IconButton, Tooltip, Badge } = window.AewebDesignSystem_20be84;
function Shell({ page, setPage, user, onLogout, children }) {
  const items = [['dash', 'layout-dashboard', 'Dashboard'], ['users', 'users', 'Benutzer'], ['docs', 'file-text', 'Dokumente'], ['set', 'settings', 'Einstellungen']];
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-page-bg)' }}>
      <aside style={{ width: 248, flex: 'none', background: 'var(--color-surface)', padding: 16, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ padding: '8px 12px 24px', fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: .5, textTransform: 'uppercase' }}>aeweb</div>
        {items.map(([id, ic, l]) => <NavItem key={id} active={page === id} onClick={() => setPage(id)} icon={<Icon name={ic} size={18} />} badge={id === 'docs' ? <Badge color="primary">3</Badge> : null}>{l}</NavItem>)}
        <div style={{ flex: 1 }} />
        <NavItem icon={<Icon name="log-out" size={18} />} onClick={onLogout}>Abmelden</NavItem>
      </aside>
      <main style={{ flex: 1, minWidth: 0, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ flex: 1 }}>{items.find(i => i[0] === page)[2]}</h2>
          <Tooltip content="Mitteilungen" placement="bottom"><IconButton label="Mitteilungen"><Icon name="bell" size={20} /></IconButton></Tooltip>
          <Avatar name={user} />
        </header>
        {children}
      </main>
    </div>
  );
}
window.Shell = Shell;
