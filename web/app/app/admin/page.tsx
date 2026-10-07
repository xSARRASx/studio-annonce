"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Activity, ArrowDownLeft, ArrowRight, Bell, Check, ChevronLeft, ChevronRight, Clock3, Crown, ImageIcon, Info, KeyRound, LoaderCircle, LockKeyhole, LogOut, MoreHorizontal, Plus, RefreshCw, Search, ShieldCheck, ShieldMinus, Trash2, UserRound, UserRoundCheck, Users, X } from "lucide-react";
import { api, type Sante } from "@/lib/api";
import { actionLabel, roleLabel, statusLabel, type AdminAction, type AdminAlerts, type AdminCommerce, type AdminDetail, type AdminLog, type AdminOverview, type AdminStatus, type AdminUser, type AdminUsers } from "@/lib/admin";
import { useStudioAccount } from "@/components/studio-account";
import { Modal } from "../../demo/studio-parts";
import AdminCosts from "@/components/admin-costs";
import AdminTrackingExports from '@/components/admin-tracking-exports';
import "./admin.css";

const date = (value: string | null, time = false) => value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", ...(time ? { timeStyle: "short" as const } : {}) }).format(new Date(value)) : "Jamais connecté";
const fullName = (user: AdminUser) => `${user.prenom} ${user.nom}`.trim() || "Profil à compléter";
const initials = (user: AdminUser) => `${user.prenom.slice(0, 1)}${user.nom.slice(0, 1)}` || user.email.slice(0, 1).toUpperCase();
const euros = (centimes: number) => (centimes / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const actions: Record<AdminAction, { title: string; description: string; button: string }> = {
  suspendre: { title: "Suspendre ce compte ?", description: "Ses sessions seront fermées et la connexion bloquée jusqu’à sa réactivation. Ses créations et ses crédits sont conservés.", button: "Suspendre le compte" },
  reactiver: { title: "Réactiver ce compte ?", description: "Cette personne pourra de nouveau se connecter avec son email et son mot de passe.", button: "Réactiver le compte" },
  supprimer: { title: "Supprimer ce compte ?", description: "Le compte sera placé dans les comptes supprimés et toutes ses sessions seront fermées. Vous pourrez le restaurer. Cette action ne purge pas ses données ni ses crédits.", button: "Supprimer le compte" },
  restaurer: { title: "Restaurer ce compte ?", description: "Le compte retrouvera ses créations et ses crédits. Il sera restauré avec un rôle client, sans droits administrateur et sans nouvel essai offert.", button: "Restaurer le compte" },
  deconnecter: { title: "Fermer toutes ses sessions ?", description: "Tous ses appareils seront déconnectés. Cette personne pourra se reconnecter avec son email et son mot de passe.", button: "Fermer les sessions" },
  nommer_admin: { title: "Ajouter cet administrateur ?", description: "Cette personne pourra consulter et gérer les comptes clients et accéder au journal d’administration. Seul vous, le propriétaire, pourrez nommer d’autres administrateurs. Ses sessions actuelles seront fermées pour qu’elle se reconnecte.", button: "Accorder l’accès administrateur" },
  retirer_admin: { title: "Retirer l’accès administrateur ?", description: "Cette personne retrouvera un compte client et ses sessions seront fermées. Ses créations et ses crédits restent conservés.", button: "Retirer l’accès administrateur" },
  reinitialiser_essais: { title: "Débloquer les créations ?", description: "Les compteurs des créations photo et vidéo depuis le dernier achat seront remis à zéro sur le site et sur mobile. Les crédits, les limites de correction par photo et les fichiers restent inchangés. Cette intervention est enregistrée dans le journal.", button: "Réinitialiser les deux compteurs" },
};

export default function AdminPage() {
  const { compte, sante } = useStudioAccount();
  const allowed = ["proprietaire", "admin"].includes(compte.role);
  return allowed ? <AdminWorkspace owner={compte.role === "proprietaire"} myId={compte.id} health={sante}/> : <main className="st-main admin-denied"><LockKeyhole size={34}/><h1>Un espace réservé.</h1><p>Votre compte ne dispose pas d’un accès à l’administration.</p><Link className="button dark" href="/app/">Revenir à mes créations <ArrowRight size={17}/></Link></main>;
}

function AdminWorkspace({ owner, myId, health }: { owner: boolean; myId: string; health: Sante | null }) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [commerce, setCommerce] = useState<AdminCommerce | null>(null);
  const [users, setUsers] = useState<AdminUsers | null>(null);
  const [logs, setLogs] = useState<AdminLog | null>(null);
  const [tab, setTab] = useState<"comptes" | "equipe" | "journal" | "alertes">("comptes");
  const [alerts, setAlerts] = useState<AdminAlerts | null>(null);
  const [alertPage, setAlertPage] = useState(1);
  const [alertError, setAlertError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"tous" | AdminStatus>("tous");
  const [page, setPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminDetail | null>(null);
  const [modalError, setModalError] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [confirmation, setConfirmation] = useState<AdminAction | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const data = await api<AdminAlerts>(`/admin/alertes?page=${alertPage}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const last = Math.max(1, Math.ceil(data.total / data.par_page));
        if (alertPage > last) { setAlertPage(last); return; }
        setAlerts(data); setAlertError("");
      } catch (e) { if (!controller.signal.aborted) setAlertError((e as Error).message); }
      finally { pending = false; }
    };
    void load();
    const refreshVisible = () => { if (document.visibilityState === "visible") void load(); };
    const timer = window.setInterval(refreshVisible, 60_000);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", refreshVisible); };
  }, [refresh, alertPage]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    api<AdminOverview>("/admin/vue-ensemble", { signal: controller.signal })
      .then(summary => { if (active) setOverview(summary); })
      .catch(e => { if (active) setError(e.message); });
    api<AdminLog>(`/admin/journal?page=${logPage}`, { signal: controller.signal })
      .then(journal => { if (active) setLogs(journal); })
      .catch(e => { if (active) setError(e.message); });
    api<AdminCommerce>("/admin/activite-commerciale", { signal: controller.signal })
      .then(sales => { if (active) setCommerce(sales); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; controller.abort(); };
  }, [refresh, logPage]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const params = new URLSearchParams({ q: search, statut: status, role: tab === "equipe" ? "equipe" : "tous", page: String(page) });
    api<AdminUsers>(`/admin/comptes?${params}`, { signal: controller.signal }).then(data => {
      if (active) { const lastPage = Math.max(1, Math.ceil(data.total / data.par_page)); if (page > lastPage) { setPage(lastPage); return; } setUsers(data); setLoading(false); }
    }).catch(e => { if (active) { setError(e.message); setLoading(false); } });
    return () => { active = false; controller.abort(); };
  }, [search, status, page, tab, refresh]);

  useEffect(() => {
    if (!modal || modal === "create") return;
    let active = true;
    api<AdminDetail>(`/admin/comptes/${modal}`).then(data => { if (active) { setDetail(data); setFirst(data.prenom); setLast(data.nom); } })
      .catch(e => { if (active) setModalError(e.message); });
    return () => { active = false; };
  }, [modal, refresh]);

  const reload = () => { setError(""); setLoading(true); setRefresh(r => r + 1); };
  function changeTab(value: typeof tab) { if (value === tab) return; setTab(value); setPage(1); setStatus("tous"); setError(""); setLoading(true); }
  function open(id: string) { setModal(id); setDetail(null); setModalError(""); setConfirmation(null); setFirst(""); setLast(""); setEmail(""); setConfirmEmail(""); }
  function close() { if (!mutation.current) { setModal(null); setConfirmation(null); setDetail(null); } }
  async function run(path: string, method: string, body: object, success: string) {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setModalError("");
    try {
      await api(path, { method, body: JSON.stringify(body) });
      setNotice(success); setModal(null); setConfirmation(null); setDetail(null); reload();
      window.dispatchEvent(new Event("studio:credits-updated"));
    } catch (e) { setModalError((e as Error).message); }
    finally { mutation.current = false; setBusy(false); }
  }
  const totalConnections = overview?.connexions.reduce((total, d) => total + d.nombre, 0) || 0;
  const maxConnections = Math.max(1, ...overview?.connexions.map(d => d.nombre) || [1]);
  const manageable = !!detail && detail.id !== myId && detail.role !== "proprietaire" && (owner || detail.role === "client");
  const risky = confirmation && ["supprimer", "nommer_admin", "retirer_admin", "reinitialiser_essais"].includes(confirmation);

  return <main className="admin-main">
    <header className="admin-heading"><div><p className="eyebrow">LE STUDIO, CÔTÉ COULISSES</p><h1>Votre administration.</h1><p>Les comptes, les accès, et une vue claire de votre activité.</p></div><span className="admin-owner"><ShieldCheck size={17}/>{owner ? "Accès propriétaire" : "Accès administrateur"}</span></header>
    {error && <div className="admin-feedback error" role="alert"><Info size={18}/><p>{error}</p><button onClick={reload}>Réessayer</button></div>}
    {notice && <div className="admin-feedback" role="status"><Check size={18}/><p>{notice}</p><button aria-label="Fermer la confirmation" onClick={() => setNotice("")}><X size={16}/></button></div>}
    {alertError && <div className="admin-feedback error" role="alert"><Bell size={18}/><p>Les notifications ne peuvent pas être actualisées. {alertError}</p><button onClick={reload}>Réessayer</button></div>}
    {!!alerts?.total && tab !== "alertes" && <div className="admin-alert-banner" role="status"><Bell size={22}/><div><strong>{alerts.total} limite{alerts.total > 1 ? "s" : ""} de créations à vérifier</strong><p>Consultez les comptes concernés avant de débloquer leurs essais.</p></div><button className="button outlined" onClick={() => changeTab("alertes")}>Voir les notifications <ArrowRight size={16}/></button></div>}
    <section className="admin-metrics" aria-label="Vue d’ensemble">
      {[{ label: "Comptes actifs", value: overview?.actifs, note: `${overview?.comptes ?? "…"} compte${overview?.comptes === 1 ? "" : "s"} au total`, Icon: Users }, { label: "Connexions sur 7 jours", value: overview ? totalConnections : undefined, note: "Connexions réussies, pas personnes distinctes", Icon: Activity }, { label: "Photos du studio", value: overview?.photos, note: "Originaux importés", Icon: ImageIcon }, { label: "Accès administrateurs", value: overview?.administrateurs, note: "Propriétaire inclus", Icon: ShieldCheck }].map(({ label, value, note, Icon }) => <article key={label} className="admin-metric"><span>{label}<Icon size={18}/></span><strong>{value ?? "—"}</strong><small>{note}</small>{label === "Connexions sur 7 jours" && overview && <details className="admin-login-breakdown"><summary>Voir qui s’est connecté</summary>{overview.connexions_par_compte.length ? <ul>{overview.connexions_par_compte.map(personne => <li key={personne.id}><button type="button" onClick={() => open(personne.id)}><strong>{personne.nom || personne.email}</strong><small>{personne.email}</small><span>{personne.nombre} connexion{personne.nombre > 1 ? "s" : ""} · dernière le {date(personne.derniere_connexion_le, true)}</span></button></li>)}</ul> : <p>Aucune connexion enregistrée sur cette période.</p>}</details>}</article>)}
    </section>
    <section className="admin-commerce" aria-label="Ventes et créations"><AdminTrackingExports /><div className="admin-section-heading"><div><h2>Ventes et créations</h2><p>Encaissements, remboursements et créations enregistrés sur tous les comptes.</p></div><button className="admin-refresh" onClick={reload} aria-label="Actualiser les ventes"><RefreshCw size={16}/></button></div>
      <div className="admin-commerce-metrics"><div><span>Encaissements avant remboursements</span><strong>{commerce ? euros(commerce.encaissements_bruts_centimes) : '—'}</strong></div><div><span>Remboursements enregistrés</span><strong>{commerce ? euros(commerce.remboursements_centimes) : '—'}</strong></div><div><span>Chiffre d’affaires net</span><strong>{commerce ? euros(commerce.ca_total_centimes) : '—'}</strong></div><div><span>Photo · net</span><strong>{commerce ? euros(commerce.ca_photo_centimes) : '—'}</strong></div><div><span>Vidéo · net</span><strong>{commerce ? euros(commerce.ca_video_centimes) : '—'}</strong></div><div><span>Achats conservés</span><strong>{commerce?.achats_payes ?? '—'}</strong></div><div><span>Achats remboursés</span><strong>{commerce?.achats_rembourses ?? '—'}</strong></div><div><span>Photos importées</span><strong>{commerce?.photos_importees ?? '—'}</strong></div><div><span>Retouches créées</span><strong>{commerce?.retouches_creees ?? '—'}</strong></div><div><span>Vidéos lancées</span><strong>{commerce?.videos_creees ?? '—'}</strong></div></div>
      {commerce && <><p className="admin-commerce-note">Un achat remboursé reste visible ci-dessous, mais ne compte plus dans le chiffre d’affaires net. {commerce.note_couts}</p><AdminCosts frais={commerce.frais} comptes={commerce.par_compte} onChange={reload}/><details><summary>Activité par compte · {commerce.par_compte.length}</summary><div className="admin-commerce-table"><table><thead><tr><th>Compte</th><th>Photos</th><th>Retouches</th><th>Vidéos</th><th>Achats photo</th><th>Achats vidéo</th><th>Ventes photo</th><th>Ventes vidéo</th><th>Remboursements</th><th>Frais saisis</th><th>Marge provisoire</th></tr></thead><tbody>{commerce.par_compte.map(row => <tr key={row.id}><td>{row.nom || row.email}<small>{row.nom && row.email}</small></td><td>{row.photos_importees}</td><td>{row.retouches_creees}</td><td>{row.videos_creees}</td><td>{row.achats_photo}</td><td>{row.achats_video}</td><td>{euros(row.ca_photo_centimes)}</td><td>{euros(row.ca_video_centimes)}</td><td>{row.achats_rembourses} · {euros(row.remboursements_centimes)}</td><td>{row.frais_centimes != null ? euros(row.frais_centimes) : "À rapprocher"}</td><td>{row.marge_provisoire_centimes != null ? euros(row.marge_provisoire_centimes) : "—"}</td></tr>)}</tbody></table></div></details><details><summary>Derniers paiements · {commerce.ventes_recentes.length}</summary><div className="admin-commerce-table"><table><thead><tr><th>Date d’achat</th><th>Compte</th><th>Produit</th><th>Crédits</th><th>Montant</th><th>État actuel</th></tr></thead><tbody>{commerce.ventes_recentes.map(sale => <tr key={sale.id}><td>{date(sale.date, true)}</td><td>{sale.compte}</td><td>{sale.nature === 'photo' ? 'Photo' : 'Vidéo'} · {sale.pack}</td><td>{sale.credits}</td><td>{euros(sale.montant_centimes)}</td><td>{sale.statut === 'rembourse' ? 'Remboursé' : 'Payé'}</td></tr>)}</tbody></table></div></details></>}
    </section>
    <div className="admin-overview-row">
      <section className="admin-activity"><div className="admin-section-heading"><div><h2>Le studio au fil des jours.</h2><p>Connexions enregistrées depuis l’activation du suivi.</p></div><span>7 derniers jours</span></div><div className="admin-chart" role="img" aria-label={overview ? overview.connexions.map(d => `${d.jour} : ${d.nombre} connexions`).join(", ") : "Chargement de l’activité"}>{overview?.connexions.map(d => <div className="admin-chart-day" key={d.jour}><span>{d.nombre}</span><div className="admin-chart-track"><i style={{ height: `${d.nombre ? Math.max(8, d.nombre / maxConnections * 100) : 3}%` }} className={d.nombre ? "has-activity" : ""}/></div><small>{new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(new Date(`${d.jour}T12:00:00`))}</small></div>)}</div></section>
      <section className="admin-services"><div className="admin-section-heading"><div><h2>État des services</h2><p>Disponibilité actuelle</p></div><span className="admin-service-icon"><Activity size={18}/></span></div>{[{ label: "Connexion par email", on: health?.connexion_disponible }, { label: "Retouche photo IA", on: health?.retouche_disponible }, { label: "Paiements", on: health?.paiement_disponible }].map(service => <div className="admin-service" key={service.label}><span>{service.label}</span><b className={service.on ? "on" : "off"}>{!health ? "Vérification…" : service.on ? "Disponible" : "À activer"}</b></div>)}<p className="admin-service-note"><LockKeyhole size={14}/> Les clés et codes de connexion restent privés.</p></section>
    </div>
    <section className="admin-directory" aria-label="Gestion des comptes">
      <div className="admin-directory-top"><div className="admin-tabs" role="tablist" aria-label="Sections d’administration">{([["comptes", "Tous les comptes", Users], ["alertes", "Notifications", Bell], ["equipe", "Administrateurs", ShieldCheck], ["journal", "Journal d’activité", Clock3]] as const).map(([id, label, Icon]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => changeTab(id)}><Icon size={16}/>{label}{id === "alertes" && !!alerts?.total && <span className="admin-alert-count">{alerts.total}</span>}</button>)}</div><div className="admin-directory-actions"><button className="admin-refresh" onClick={reload} aria-label="Actualiser l’administration"><RefreshCw size={16}/></button><button className="button dark" onClick={() => open("create")}><Plus size={16}/> Créer un compte</button></div></div>
      {tab === "alertes" ? <>
        <div className="admin-table-intro"><h2>Les créations à débloquer.</h2><p>Une notification au seuil de 30 photos ou 10 vidéos depuis le dernier achat. Elle se résout après un achat ou votre déblocage.</p></div>
        <div className="admin-alert-list">{alerts?.alertes.map(alert => <article key={alert.id}><span className="admin-log-icon"><Bell size={18}/></span><div><strong>{`${alert.compte.prenom} ${alert.compte.nom}`.trim() || "Profil à compléter"}</strong><p className="admin-alert-email">{alert.compte.email}</p><p>{alert.message}</p><span className="admin-alert-quota">{alert.utilisees} / {alert.limite} {alert.nature === "photo" ? "photos" : "vidéos"}</span></div><button className="button outlined" onClick={() => open(alert.compte.id)}>Voir le compte <ArrowRight size={15}/></button></article>)}{!alerts && !alertError && <p className="admin-empty" role="status">Chargement des notifications…</p>}{alerts?.total === 0 && <div className="admin-empty"><Check size={26}/><strong>Aucun compte à débloquer.</strong><p>Les nouvelles limites atteintes apparaîtront ici automatiquement.</p></div>}</div>
        <Pagination page={alertPage} total={alerts?.total || 0} change={setAlertPage}/>
      </> : tab === "journal" ? <>
        <div className="admin-table-intro"><h2>Chaque changement garde une trace.</h2><p>Créations de comptes, modifications de profil et changements d’accès.</p></div>
        <div className="admin-log">{logs?.evenements.map(event => <article key={event.id}><span className="admin-log-icon"><ShieldCheck size={17}/></span><div><strong>{actionLabel[event.action] || event.action}</strong><p>{event.cible}</p><small>Par {event.acteur}</small></div><time>{date(event.le, true)}</time></article>)}{logs && !logs.total && <p className="admin-empty">Les prochaines actions d’administration apparaîtront ici.</p>}</div>
        <Pagination page={logPage} total={logs?.total || 0} change={setLogPage}/>
      </> : <>
        {tab === "equipe" && <div className="admin-table-intro"><h2>Les personnes qui vous accompagnent.</h2><p>{owner ? "Pour ajouter un administrateur, ouvrez sa fiche dans Tous les comptes puis accordez-lui l’accès. Son email doit déjà être validé." : "Le propriétaire gère les accès de l’équipe d’administration."}</p><button className="text-action" onClick={() => changeTab("comptes")}>Trouver un compte à ajouter <ArrowRight size={15}/></button></div>}
        <div className="admin-filters"><form onSubmit={event => { event.preventDefault(); setSearch(query); setPage(1); reload(); }}><Search size={18}/><input aria-label="Rechercher un compte" type="search" placeholder="Un nom, un prénom ou un email…" value={query} onChange={event => setQuery(event.target.value)} maxLength={120}/><button type="submit">Rechercher</button></form><label><span>État</span><select aria-label="Filtrer par état" value={status} onChange={event => { setStatus(event.target.value as typeof status); setPage(1); setLoading(true); }}><option value="tous">Tous les états</option><option value="actif">Actifs</option><option value="suspendu">Suspendus</option><option value="supprime">Supprimés</option></select></label></div>
        <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Compte</th><th>Rôle</th><th>État</th><th>Dernière connexion</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{!loading && users?.comptes.map(user => <tr key={user.id}><td><button className="admin-person" onClick={() => open(user.id)}><span className={`admin-avatar ${user.role === "proprietaire" ? "owner" : ""}`}>{initials(user)}</span><span><strong>{fullName(user)}{user.id === myId && <em>Vous</em>}</strong><small>{user.email}</small></span></button></td><td><span className={`admin-role ${user.role}`}>{user.role === "proprietaire" && <Crown size={13}/>} {roleLabel[user.role]}</span></td><td><span className={`admin-status ${user.statut}`}><i/>{statusLabel[user.statut]}</span></td><td><span className="admin-last-login">{date(user.derniere_connexion_le)}<small>{user.email_verifie_le ? `${user.sessions} session${user.sessions > 1 ? "s" : ""}` : "Email à valider"}</small></span></td><td><button className="admin-row-open" onClick={() => open(user.id)} aria-label={`Gérer le compte de ${user.email}`}><MoreHorizontal size={20}/></button></td></tr>)}</tbody></table></div>
        {loading ? <p className="admin-empty" role="status"><LoaderCircle className="admin-spin" size={18}/> Chargement des comptes…</p> : !users?.comptes.length && <div className="admin-empty"><UserRound size={28}/><strong>Aucun compte dans cette sélection.</strong><p>Essayez un autre nom ou changez le filtre.</p></div>}
        <Pagination page={page} total={users?.total || 0} change={value => { setPage(value); setLoading(true); }}/>
      </>}
    </section>
    <footer className="admin-footer"><ShieldCheck size={15}/><span>Les droits sont vérifiés pour chaque action. Votre accès propriétaire est protégé.</span></footer>

    {modal && <Modal title={modal === "create" ? "Créer un compte" : confirmation ? actions[confirmation].title : "Fiche du compte"} onClose={close} wide>
      <div className="admin-modal-body">
        {modalError && <p className="admin-feedback error" role="alert">{modalError}<button onClick={() => { setModalError(""); setConfirmation(null); setRefresh(r => r + 1); }} disabled={busy}>Actualiser</button></p>}
        {modal === "create" ? <form onSubmit={event => { event.preventDefault(); void run("/admin/comptes", "POST", { prenom: first, nom: last, email: email.trim() }, "Le compte client est créé. Son titulaire pourra choisir son mot de passe et valider son email depuis la page d’inscription."); }}>
          <div className="admin-modal-lead"><span className="admin-modal-symbol"><UserRoundCheck size={25}/></span><h3>Un nouvel espace, prêt à l’accueillir.</h3><p>Créez un compte client. Son titulaire devra terminer son inscription pour choisir son mot de passe et vérifier son email. Aucun message n’est envoyé par ce formulaire.</p></div>
          <div className="admin-form-grid"><label>Prénom<input required maxLength={80} value={first} onChange={e => setFirst(e.target.value)} autoComplete="off"/></label><label>Nom<input required maxLength={80} value={last} onChange={e => setLast(e.target.value)} autoComplete="off"/></label><label className="full">Adresse email<input required type="email" maxLength={320} value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" placeholder="prenom@entreprise.fr"/></label></div>
          <div className="admin-modal-actions"><button type="button" className="button outlined" onClick={close} disabled={busy}>Annuler</button><button className="button dark" type="submit" disabled={busy || !first.trim() || !last.trim()}>{busy ? "Création…" : "Créer le compte client"}<ArrowRight size={16}/></button></div>
        </form> : !detail ? <p className="admin-empty" role="status">Chargement de la fiche…</p> : confirmation ? <form onSubmit={event => { event.preventDefault(); void run(`/admin/comptes/${detail.id}/actions`, "POST", { revision: detail.revision, action: confirmation, confirmation_email: risky ? confirmEmail.trim() : detail.email }, `${actionLabel[confirmation]} : ${detail.email}.`); }}>
          <div className="admin-confirm-account"><span className="admin-avatar">{initials(detail)}</span><div><strong>{fullName(detail)}</strong><p>{detail.email}</p></div></div><p className="admin-confirm-description">{actions[confirmation].description}</p>
          {risky && <label className="admin-confirm-email">Recopiez l’adresse email pour confirmer<input type="email" required autoComplete="off" placeholder={detail.email} value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)}/></label>}
          <div className="admin-modal-actions"><button className="button outlined" type="button" disabled={busy} onClick={() => { setConfirmation(null); setModalError(""); }}>Annuler</button><button type="submit" className={`button ${confirmation === "supprimer" ? "admin-danger-button" : "dark"}`} disabled={busy || (!!risky && confirmEmail.trim().toLowerCase() !== detail.email)}>{busy ? "Enregistrement…" : actions[confirmation].button}</button></div>
        </form> : <>
          <div className="admin-detail-head"><span className={`admin-avatar large ${detail.role === "proprietaire" ? "owner" : ""}`}>{initials(detail)}</span><div><h3>{fullName(detail)}</h3><p>{detail.email}</p><div><span className={`admin-role ${detail.role}`}>{roleLabel[detail.role]}</span><span className={`admin-status ${detail.statut}`}><i/>{statusLabel[detail.statut]}</span></div></div></div>
          <div className="admin-detail-stats"><div><strong>{detail.photos}</strong><span>photos</span></div><div><strong>{detail.solde}</strong><span>crédits</span></div><div><strong>{detail.sessions}</strong><span>sessions</span></div><div><strong>{detail.logements}</strong><span>logements</span></div></div>
          <div className="admin-detail-meta"><span><Clock3 size={15}/> Créé le {date(detail.cree_le)}</span><span><ShieldCheck size={15}/>{detail.email_verifie_le ? `Email validé le ${date(detail.email_verifie_le)}` : "Email en attente de validation"}</span></div>
          {detail.limites && <section className="admin-detail-section"><h4><ImageIcon size={17}/> Créations depuis le dernier achat</h4><div className="admin-creation-counts">{(["photo", "video"] as const).map(kind => <div key={kind}><strong>{detail.limites[kind].utilisees} / {detail.limites[kind].limite}</strong><span>{kind === "photo" ? "Photos" : "Vidéos"} · {detail.limites[kind].bloque ? "Nouvelles créations bloquées" : `${detail.limites[kind].restantes} restantes`}</span></div>)}</div><p>Les compteurs sont communs au site et à l’application. Les téléchargements déjà acquis restent disponibles. Un ancien téléchargement ne remet pas les compteurs à zéro.</p>{manageable && detail.statut === "actif" && <ActionButton icon={<RefreshCw size={16}/>} label="Débloquer les créations" disabled={busy || (!detail.limites.photo.utilisees && !detail.limites.video.utilisees)} onClick={() => { setConfirmation("reinitialiser_essais"); setConfirmEmail(""); }}/>}</section>}
          {manageable && detail.statut !== "supprime" && <form className="admin-profile-edit" onSubmit={event => { event.preventDefault(); void run(`/admin/comptes/${detail.id}`, "PATCH", { revision: detail.revision, prenom: first, nom: last }, "Les informations du compte sont enregistrées."); }}><h4>Informations du compte</h4><div className="admin-form-grid"><label>Prénom<input required maxLength={80} value={first} onChange={e => setFirst(e.target.value)}/></label><label>Nom<input required maxLength={80} value={last} onChange={e => setLast(e.target.value)}/></label></div><button className="button outlined" type="submit" disabled={busy || !first.trim() || !last.trim() || (first === detail.prenom && last === detail.nom)}>Enregistrer les informations</button></form>}
          <section className="admin-detail-section"><h4><KeyRound size={17}/> Connexions et accès</h4><p>Dernière connexion : {date(detail.derniere_connexion_le, true)}.</p>{detail.connexions.length > 0 && <details><summary>Voir les {detail.connexions.length} dernières connexions enregistrées</summary><ul>{detail.connexions.map((d, index) => <li key={`${d}-${index}`}><ArrowDownLeft size={13}/>{date(d, true)}</li>)}</ul></details>}
            {manageable ? <div className="admin-access-actions">{detail.statut === "actif" && <><ActionButton icon={<LogOut size={16}/>} label="Fermer toutes les sessions" disabled={busy || detail.sessions === 0} onClick={() => { setConfirmation("deconnecter"); setConfirmEmail(""); }}/><ActionButton icon={<LockKeyhole size={16}/>} label="Suspendre l’accès" disabled={busy} onClick={() => setConfirmation("suspendre")}/></>}{detail.statut === "suspendu" && <ActionButton icon={<UserRoundCheck size={16}/>} label="Réactiver le compte" disabled={busy} onClick={() => setConfirmation("reactiver")}/ >}{detail.statut === "supprime" && <ActionButton icon={<RefreshCw size={16}/>} label="Restaurer le compte" disabled={busy} onClick={() => setConfirmation("restaurer")}/ >}</div> : <p className="admin-protected"><ShieldCheck size={16}/>{detail.id === myId ? "Votre propre accès est protégé. Modifiez votre profil depuis Mon compte." : "Seul le propriétaire peut gérer ce niveau d’accès."}</p>}
          </section>
          {manageable && owner && detail.statut === "actif" && <section className="admin-detail-section"><h4><ShieldCheck size={17}/> Accès à l’administration</h4><p>{detail.role === "admin" ? "Ce compte peut consulter et gérer les comptes clients." : "Accordez l’accès uniquement à une personne de confiance. Elle pourra gérer les comptes clients."}</p><ActionButton disabled={busy || !detail.email_verifie_le} icon={detail.role === "admin" ? <ShieldMinus size={16}/> : <ShieldCheck size={16}/>} label={detail.role === "admin" ? "Retirer les droits administrateur" : "Ajouter comme administrateur"} onClick={() => { setConfirmation(detail.role === "admin" ? "retirer_admin" : "nommer_admin"); setConfirmEmail(""); }}/>{!detail.email_verifie_le && <small className="admin-hint">Cette personne doit d’abord se connecter et valider son email.</small>}</section>}
          {manageable && detail.statut !== "supprime" && <section className="admin-detail-section admin-danger"><div><h4>Supprimer le compte</h4><p>Le déplacer vers les comptes supprimés. Une restauration restera possible.</p></div><button disabled={busy} onClick={() => { setConfirmation("supprimer"); setConfirmEmail(""); }}><Trash2 size={16}/> Supprimer</button></section>}
        </>}
      </div>
    </Modal>}
  </main>;
}

function ActionButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean }) { return <button type="button" className="button outlined" disabled={disabled} onClick={onClick}>{icon}{label}</button>; }
function Pagination({ page, total, change }: { page: number; total: number; change: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / 20));
  return <div className="admin-pagination"><span>{total} résultat{total > 1 ? "s" : ""}</span><div><button aria-label="Page précédente" disabled={page <= 1} onClick={() => change(page - 1)}><ChevronLeft size={17}/></button><span>Page {page} sur {pages}</span><button aria-label="Page suivante" disabled={page >= pages} onClick={() => change(page + 1)}><ChevronRight size={17}/></button></div></div>;
}
