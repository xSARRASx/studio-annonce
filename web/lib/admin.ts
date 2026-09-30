import type { LimitesCreation } from "./api";
export type AdminRole = "proprietaire" | "admin" | "client";
export type AdminStatus = "actif" | "suspendu" | "supprime";
export type AdminUser = {
  id: string; email: string; prenom: string; nom: string; role: AdminRole; statut: AdminStatus;
  revision: number; cree_le: string; email_verifie_le: string | null; derniere_connexion_le: string | null; sessions: number;
};
export type AdminDetail = AdminUser & { solde: number; photo_offerte_utilisee: boolean; logements: number; photos: number; connexions: string[]; limites: LimitesCreation };
export type AdminOverview = { comptes: number; actifs: number; suspendus: number; supprimes: number; administrateurs: number; photos: number; connexions: { jour: string; nombre: number }[] };
export type AdminUsers = { comptes: AdminUser[]; total: number; page: number; par_page: number };
export type AdminAlerts = { total: number; page: number; par_page: number; alertes: { id: string; nature: "photo" | "video"; utilisees: number; limite: number; message: string; compte: Omit<AdminUser, "sessions"> }[] };
export type AdminLog = { total: number; page: number; par_page: number; evenements: { id: number; action: string; le: string; acteur: string; cible: string }[] };
export type AdminAction = "suspendre" | "reactiver" | "supprimer" | "restaurer" | "deconnecter" | "nommer_admin" | "retirer_admin" | "reinitialiser_essais";
export const roleLabel: Record<AdminRole, string> = { proprietaire: "Propriétaire", admin: "Administrateur", client: "Client" };
export const statusLabel: Record<AdminStatus, string> = { actif: "Actif", suspendu: "Suspendu", supprime: "Supprimé" };
export const actionLabel: Record<string, string> = { compte_cree: "Compte créé", profil_modifie: "Profil modifié", proprietaire_initialise: "Propriétaire configuré", suspendre: "Compte suspendu", reactiver: "Compte réactivé", supprimer: "Compte supprimé", restaurer: "Compte restauré", deconnecter: "Sessions fermées", nommer_admin: "Administrateur ajouté", retirer_admin: "Droits administrateur retirés", reinitialiser_essais: "Compteurs d’essais réinitialisés" };
