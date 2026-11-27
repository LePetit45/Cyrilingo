// French UI strings (MVP locale). Learner-facing text is allowed in French here only (see CLAUDE.md).
// French typography: no-break spaces before : ! ? and inside « ».
import type { ApiErrorCode, GoogleErrorCode } from '#lib/api/client.js';

export const fr = {
	app: {
		name: 'Cyrilingo',
		tagline: 'Apprends à lire l’alphabet cyrillique bulgare.'
	},
	nav: {
		label: 'Navigation principale',
		path: 'Parcours',
		alphabet: 'Alphabet',
		review: 'Révision',
		lists: 'Listes',
		more: 'Plus'
	},
	common: {
		close: 'Fermer',
		cancel: 'Annuler',
		continue: 'Continuer',
		listen: 'Écouter',
		listenSlowly: 'Écouter lentement'
	},
	welcome: {
		title: 'Bienvenue sur Cyrilingo !',
		lines: [
			'En 10 petites leçons, tu vas apprendre à lire l’alphabet bulgare.',
			'Chaque leçon te présente 3 nouvelles lettres, puis te fait lire de vrais mots.',
			'Au bout du chemin, l’Épreuve de Preslav t’attend… avec un diplôme à la clé !'
		],
		start: 'C’est parti !'
	},
	home: {
		title: 'Ton parcours',
		start: 'Commencer',
		lettersRead: (count: number, total: number) => `${count} lettres lues sur ${total}`,
		section: (number: number, letters: number) => `Section ${number} · ${letters} lettres`,
		lesson: (number: number) => `Leçon ${number}`,
		lessonStates: {
			completed: 'Terminée',
			suggested: 'À faire maintenant',
			notDone: 'Pas encore faite'
		},
		exam: 'L’Épreuve de Preslav',
		examHint: 'L’épreuve finale : 30 questions sur toutes les lettres.',
		examPassed: 'Réussie !',
		allDone: 'Tu as terminé toutes les leçons. L’épreuve finale t’attend !',
		allDoneAndPassed: 'Tu as tout terminé. Bravo, saint-maître du cyrillique !',
		progressTitle: 'Ta progression',
		lettersReadShort: (total: number) => `/ ${total} lettres lues`,
		freeReview: 'Révision libre',
		freeReviewText: 'Repasse sur les lettres déjà vues, sans pression.',
		freeReviewHint: 'Termine une leçon pour débloquer la révision libre.',
		review: 'Réviser',
		syncing: 'Synchronisation…',
		syncError:
			'Impossible de synchroniser ta progression. Elle reste enregistrée sur cet appareil.',
		syncRetry: 'Réessayer'
	},
	card: {
		letter: 'Lettre',
		readAs: 'Se lit',
		official: 'officiel',
		sound: 'Le son',
		examples: 'Exemples',
		note: 'Bon à savoir',
		standardShape: 'Hors de Bulgarie (en russe par exemple), la minuscule s’écrit souvent :',
		taughtAs: (combination: string) => `S’apprend avec О : ${combination}`,
		next: 'Suivant',
		start: 'Aux questions !',
		position: (index: number, total: number) => `Lettre ${index} sur ${total}`
	},
	question: {
		letterToSound: 'Comment se lit cette lettre ?',
		soundToLetter: 'Quelle lettre fait ce son ?',
		readWord: 'Lis ce mot',
		readSyllable: 'Lis cette syllabe',
		answerLabel: 'Ta lecture, en lettres latines',
		answerPlaceholder: 'Écris ce que tu lis',
		check: 'Vérifier',
		dontKnow: 'Je ne sais pas',
		keyHint: 'Astuce : touches 1 à 4 pour répondre',
		readAloud: 'Lis ce mot à voix haute',
		readAloudHint: 'Touche le micro, lis le mot, puis touche-le à nouveau.',
		startRecording: 'Parler',
		stopRecording: 'Arrêter',
		listening: 'J’écoute…',
		analyzing: 'J’analyse ta lecture…',
		cantSpeak: 'Je ne peux pas parler'
	},
	feedback: {
		correct: ['Bravo !', 'Excellent !', 'Parfait !', 'Bien joué !', 'Super !'],
		wrong: 'Pas tout à fait…',
		/** Announced to screen readers after an answer. */
		announceCorrect: 'Bonne réponse.',
		announceWrong: 'Mauvaise réponse.',
		dontKnow: 'Voici la réponse',
		answer: 'Réponse :',
		yourAnswer: 'Ta réponse :',
		meaning: 'Sens :',
		heard: 'J’ai entendu :',
		notHeard: 'Je n’ai rien entendu',
		notHeardHint: 'Rapproche-toi du micro et réessaie.',
		retry: 'Réessayer',
		passed: 'On passe à la suite, sans pénalité.',
		unavailableTitle: 'Lecture à voix haute indisponible',
		/** Why a read-aloud question could not be checked; the lesson goes on without them. */
		unavailable: {
			service:
				'La vérification de ta lecture ne répond pas pour l’instant. La leçon continue sans lecture à voix haute.',
			quota:
				'Tu as fait beaucoup d’essais de lecture à voix haute ces dernières 24 heures. La leçon continue sans.',
			denied:
				'Le micro est bloqué. Autorise-le dans les réglages de ton navigateur pour lire à voix haute. La leçon continue sans.',
			missing: 'Aucun micro n’est disponible sur cet appareil. La leçon continue sans.'
		}
	},
	keyboard: {
		label: 'Clavier',
		backspace: 'Effacer'
	},
	session: {
		quit: 'Quitter',
		quitTitle: 'Quitter la leçon ?',
		quitMessage: 'Ta progression dans cette leçon sera perdue.',
		quitConfirm: 'Quitter',
		quitCancel: 'Rester',
		progress: 'Progression'
	},
	summary: {
		lessonTitle: 'Leçon terminée !',
		reviewTitle: 'Révision terminée !',
		firstTry: 'Du premier coup',
		lettersRead: 'Lettres lues',
		newLetters: (count: number) => `Tu sais lire ${count} nouvelles lettres de plus.`,
		learned: 'Lettres apprises',
		missed: 'Lettres à revoir',
		noMiss: 'Aucune erreur, chapeau !',
		next: 'Continuer',
		replay: 'Recommencer',
		home: 'Accueil',
		readAloudInvite: 'Avec un compte, tu lis aussi des mots à voix haute pendant les leçons.',
		readAloudSignIn: 'Se connecter'
	},
	review: {
		title: 'Révision libre',
		empty: 'Termine au moins une leçon pour pouvoir réviser.',
		quitTitle: 'Quitter la révision ?',
		quitMessage: 'Cette révision ne sera pas enregistrée.',
		backHome: 'Retour au parcours'
	},
	exam: {
		title: 'L’Épreuve de Preslav',
		intro:
			'À Preslav, il y a plus de mille ans, des lettrés ont façonné l’alphabet cyrillique. À ton tour de faire tes preuves !',
		rules: 'Une question par lettre, surtout des mots à lire. Pas d’indice ni de seconde chance.',
		questions: 'Questions',
		toPass: 'Pour réussir',
		correct: 'Bonnes réponses',
		start: 'Commencer l’épreuve',
		quitTitle: 'Abandonner l’épreuve ?',
		quitMessage: 'Tes réponses à cette épreuve seront perdues.',
		passedTitle: 'Épreuve réussie !',
		failedTitle: 'Presque !',
		score: (correct: number, total: number) => `${correct}/${total}`,
		failedHint: 'Révise un peu et retente ta chance !',
		retry: 'Retenter l’épreuve',
		seeDiploma: 'Voir mon diplôme',
		backHome: 'Retour au parcours'
	},
	diploma: {
		heading: 'Diplôme',
		school: 'L’École suprême Cyrilingo',
		awardedTo: 'décerne à',
		defaultName: 'toi',
		theTitle: 'le titre de',
		/** Bulgarian, shown with the Bulgarian letter shapes. */
		signature: 'Преслав',
		title: 'Saint-maître absolue du cyrillique',
		nameLabel: 'Ton prénom (il n’est pas enregistré)',
		namePlaceholder: 'Ton prénom',
		date: (date: Date) =>
			date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
		backHome: 'Retour au parcours'
	},
	lists: {
		title: 'Mes listes',
		intro: 'Garde les mots que tu veux revoir, puis révise-les quand tu veux.',
		guestInvite: 'Connecte-toi pour créer tes listes de mots et les réviser.',
		signIn: 'Se connecter',
		signUp: 'Créer un compte',
		loading: 'Chargement de tes listes…',
		none: 'Tu n’as pas encore de liste.',
		emptyList: 'Cette liste est vide. Ajoute des mots depuis une leçon.',
		wordCount: (count: number) => `${count} mot${count > 1 ? 's' : ''}`,
		create: 'Créer une liste',
		nameHint: 'De 1 à 40 caractères.',
		createSubmit: 'Créer',
		created: (name: string) => `Liste « ${name} » créée.`,
		retry: 'Réessayer',
		back: 'Retour à mes listes',
		notFound: 'Cette liste n’existe pas, ou plus.',
		review: 'Réviser ma liste',
		rename: 'Renommer',
		renameTitle: 'Renommer la liste',
		name: 'Nom de la liste',
		save: 'Enregistrer',
		renamed: 'Liste renommée.',
		delete: 'Supprimer la liste',
		deleteTitle: 'Supprimer cette liste ?',
		deleteMessage: (name: string) =>
			`La liste « ${name} » et tous ses mots seront effacés. Ça ne peut pas être annulé.`,
		deleteConfirm: 'Supprimer',
		removeWord: (word: string) => `Retirer « ${word} » de la liste`,
		wordRemoved: (word: string) => `« ${word} » retiré de la liste.`,
		wordsTitle: 'Mots',
		reviewTitle: 'Réviser ma liste',
		reviewEmpty: 'Cette liste est vide : ajoute des mots depuis une leçon pour la réviser.',
		reviewQuitTitle: 'Quitter la révision ?',
		reviewQuitMessage: 'Cette révision ne sera pas enregistrée.',
		addToList: 'Ajouter à une liste',
		addTitle: (word: string) => `Ajouter « ${word} » à une liste`,
		addTo: 'Touche une liste pour y ajouter le mot, ou pour l’en retirer :',
		inList: 'Dans la liste',
		add: 'Ajouter',
		remove: 'Retirer',
		/** The name of a list made by the + button, numbered when the first is taken. */
		newListName: (number: number) => (number === 1 ? 'Nouvelle liste' : `Nouvelle liste ${number}`)
	},
	alphabet: {
		title: 'L’alphabet',
		learnedCount: (count: number, total: number) =>
			`${count} lettre${count > 1 ? 's' : ''} apprise${count > 1 ? 's' : ''} sur ${total}`,
		learned: 'apprise',
		notLearned: 'pas encore apprise'
	},
	settings: {
		title: 'Réglages',
		soundSection: 'Sons',
		progressSection: 'Progression',
		appSection: 'Application',
		sound: 'Voix',
		soundHint: 'Prononciation des lettres et des mots.',
		soundEffects: 'Effets sonores',
		soundEffectsHint: 'Petits sons pour les bonnes et mauvaises réponses.',
		reset: 'Réinitialiser ma progression',
		resetTitle: 'Tout recommencer ?',
		resetMessage: 'Tes leçons terminées et ton épreuve réussie seront effacées.',
		resetMessageSignedIn:
			'Tes leçons terminées et ton épreuve réussie seront effacées de ton compte, sur tous tes appareils.',
		resetConfirm: 'Tout effacer',
		resetDone: 'Ta progression a été réinitialisée.',
		about: 'À propos de Cyrilingo'
	},
	auth: {
		signInTitle: 'Connexion',
		signUpTitle: 'Créer un compte',
		signInIntro: 'Connecte-toi pour garder ta progression sur tous tes appareils.',
		signUpIntro:
			'Un compte garde ta progression sur tous tes appareils. Il reste facultatif : tout le cours fonctionne sans.',
		email: 'Adresse e-mail',
		password: 'Mot de passe',
		passwordHint: 'De 8 à 128 caractères.',
		signIn: 'Se connecter',
		signUp: 'Créer mon compte',
		google: 'Continuer avec Google',
		or: 'ou',
		busy: 'Un instant…',
		noAccount: 'Pas encore de compte ?',
		toSignUp: 'Crée-le ici',
		haveAccount: 'Déjà un compte ?',
		toSignIn: 'Connecte-toi',
		back: 'Retour aux réglages'
	},
	google: {
		title: 'Connexion avec Google',
		finishing: 'Connexion avec Google…',
		passwordRemovedTitle: 'Ton compte est lié à Google',
		passwordRemoved:
			'Ce compte avait été créé avec un mot de passe, sans que l’adresse soit vérifiée. Par sécurité, ce mot de passe a été supprimé et tes autres appareils ont été déconnectés. Connecte-toi désormais avec Google, ou choisis un nouveau mot de passe.',
		choosePassword: 'Choisir un mot de passe',
		retry: 'Réessayer',
		backToSignIn: 'Retour à la connexion',
		errors: {
			google_failed: 'La connexion avec Google n’a pas abouti. Réessaie.',
			google_unverified:
				'Google n’a pas vérifié cette adresse e-mail. Vérifie-la dans ton compte Google, ou crée un compte avec un mot de passe.',
			google_unavailable:
				'La connexion avec Google n’est pas disponible pour le moment. Utilise ton adresse e-mail et un mot de passe.',
			google_cancelled: 'Connexion avec Google annulée.'
		} satisfies Record<GoogleErrorCode, string>
	},
	account: {
		section: 'Compte',
		guestInvite: 'Connecte-toi pour garder ta progression sur tous tes appareils.',
		signIn: 'Se connecter',
		signUp: 'Créer un compte',
		email: 'Adresse e-mail',
		signInWith: 'Connexion avec',
		withPassword: 'Mot de passe',
		withGoogle: 'Google',
		checking: 'Vérification de ton compte…',
		changePassword: 'Changer mon mot de passe',
		setPassword: 'Choisir un mot de passe',
		signOut: 'Se déconnecter',
		signedOut: 'Déconnexion réussie sur cet appareil.',
		deleteAccount: 'Supprimer mon compte',
		deleteTitle: 'Supprimer ton compte ?',
		deleteMessage:
			'Ton compte et tout ce qu’il contient seront effacés définitivement, sur tous tes appareils.',
		deleteConfirm: 'Supprimer définitivement',
		deleted: 'Ton compte a été supprimé.'
	},
	agent: {
		section: 'Clé MCP',
		help: 'À quoi sert cette clé ?',
		helpText:
			'Elle permet à un assistant IA compatible MCP d’utiliser Cyrilingo à ta place. Elle n’est visible qu’au moment où tu la régénères.',
		serverAddress: (url: string) => `Adresse du serveur : ${url}`,
		key: 'Clé pour un agent IA',
		none: 'Aucune clé',
		copy: 'Copier la clé',
		copied: 'Clé copiée.',
		regenerate: 'Régénérer',
		regenerateTitle: 'Régénérer la clé ?',
		regenerateMessage:
			'L’ancienne clé cessera aussitôt de fonctionner : les agents qui l’utilisent devront recevoir la nouvelle.',
		regenerateConfirm: 'Régénérer'
	},
	password: {
		title: 'Mot de passe',
		current: 'Mot de passe actuel',
		next: 'Nouveau mot de passe',
		save: 'Enregistrer',
		saved: 'Ton mot de passe est changé. Tes autres appareils ont été déconnectés.',
		back: 'Retour aux réglages'
	},
	/** One sentence per error code of the API client: never the response body (SPEC.md › UI). */
	errors: {
		invalid_credentials: 'E-mail ou mot de passe incorrect.',
		email_taken: 'Un compte existe déjà avec cette adresse. Connecte-toi plutôt.',
		email_taken_google:
			'Un compte existe déjà avec cette adresse, et il se connecte avec Google. Utilise Google pour te connecter.',
		invalid_password: 'Le mot de passe doit faire de 8 à 128 caractères.',
		wrong_password: 'Ton mot de passe actuel est incorrect.',
		too_many_attempts: 'Trop de tentatives de connexion. Réessaie dans un quart d’heure.',
		too_many_sign_ups:
			'Trop de comptes ont été créés depuis cette connexion. Réessaie dans une heure.',
		speech_quota_reached:
			'Tu as fait beaucoup d’essais de lecture à voix haute ces dernières 24 heures. Réessaie plus tard.',
		unknown_word: 'Ce mot ne fait pas partie du cours.',
		payload_too_large: 'L’enregistrement est trop long.',
		unauthenticated: 'Ta session a expiré. Reconnecte-toi.',
		invalid_input: 'Vérifie l’adresse e-mail et le mot de passe.',
		invalid_list_name: 'Le nom d’une liste doit faire de 1 à 40 caractères.',
		list_limit_reached: 'Tu as déjà 20 listes. Supprimes-en une pour en créer une autre.',
		word_already_in_list: 'Ce mot est déjà dans cette liste.',
		list_full: 'Cette liste est pleine : elle ne peut pas dépasser 200 mots.',
		not_found: 'Cette liste n’existe pas, ou plus. Recharge la page.',
		network: 'Impossible de joindre Cyrilingo. Vérifie ta connexion et réessaie.',
		unknown: 'Une erreur est survenue. Réessaie dans un moment.'
	} satisfies Record<ApiErrorCode, string>,
	about: {
		title: 'À propos',
		paragraphs: [
			'Cyrilingo t’apprend à lire l’alphabet cyrillique bulgare : panneaux, menus, noms de villes… même sans comprendre la langue.',
			'Tout fonctionne hors connexion une fois l’application ouverte. Sans compte, ta progression reste dans ton navigateur. Le seul cookie est celui de ta session si tu te connectes, et il n’y a aucun suivi.',
			'Lecture à voix haute : quand tu lis un mot au micro, l’enregistrement de ta voix est envoyé à Microsoft Azure, qui le transcrit. Ni Cyrilingo ni Azure ne le conservent, et rien d’autre n’est envoyé : ni le mot attendu, ni ton adresse e-mail.'
		],
		version: (version: string) => `Version ${version}`,
		back: 'Retour aux réglages'
	}
};
