// French UI strings (MVP locale). Learner-facing text is allowed in French here only (see CLAUDE.md).
// French typography: no-break spaces before : ! ? and inside « ».
export const fr = {
	app: {
		name: 'Cyrilingo',
		tagline: 'Apprends à lire l’alphabet cyrillique bulgare.'
	},
	nav: {
		label: 'Navigation principale',
		path: 'Parcours',
		alphabet: 'Alphabet',
		settings: 'Réglages'
	},
	common: {
		close: 'Fermer',
		cancel: 'Annuler',
		continue: 'Continuer',
		listen: 'Écouter'
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
		continue: 'Continuer',
		start: 'Commencer',
		freeReview: 'Révision libre',
		freeReviewHint: 'Termine une leçon pour débloquer la révision libre.',
		lesson: (number: number) => `Leçon ${number}`,
		lessonStates: {
			completed: 'Terminée',
			suggested: 'À faire maintenant',
			notDone: 'Pas encore faite'
		},
		exam: 'L’Épreuve de Preslav',
		examHint: 'L’épreuve finale : 30 questions sur toutes les lettres.',
		examPassed: 'Réussie !',
		allDone: 'Tu as terminé toutes les leçons. L’épreuve finale t’attend !',
		allDoneAndPassed: 'Tu as tout terminé. Bravo, saint-maître du cyrillique !'
	},
	card: {
		newLetter: 'Nouvelle lettre',
		letter: 'Lettre',
		readAs: 'Se lit',
		official: 'officiel',
		sound: 'Le son',
		mnemonic: 'Pour s’en souvenir',
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
		validate: 'Valider',
		dontKnow: 'Je ne sais pas',
		keyHint: 'Astuce : touches 1 à 4 pour répondre'
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
		reminder: 'Rappel',
		meaning: 'Sens :',
		stressHint: 'La voyelle soulignée porte l’accent.'
	},
	keyboard: {
		label: 'Clavier',
		backspace: 'Effacer',
		validate: 'Valider'
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
		firstTry: 'Réussi du premier coup',
		missed: 'Lettres à revoir',
		noMiss: 'Aucune erreur, chapeau !',
		next: 'Continuer',
		replay: 'Recommencer'
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
		intro: [
			'À Preslav, il y a plus de mille ans, des lettrés ont façonné l’alphabet cyrillique.',
			'À ton tour de faire tes preuves : 30 questions, une par lettre, surtout des mots à lire.',
			'Pas d’indice ni de seconde chance. Il faut au moins 27 bonnes réponses pour réussir.'
		],
		start: 'Commencer l’épreuve',
		quitTitle: 'Abandonner l’épreuve ?',
		quitMessage: 'Tes réponses à cette épreuve seront perdues.',
		passedTitle: 'Épreuve réussie !',
		failedTitle: 'Presque !',
		score: (correct: number, total: number) => `${correct} / ${total}`,
		failedHint: 'Il faut au moins 27 bonnes réponses. Révise un peu et retente ta chance !',
		retry: 'Retenter l’épreuve',
		seeDiploma: 'Voir mon diplôme',
		backHome: 'Retour au parcours'
	},
	diploma: {
		heading: 'Diplôme',
		school: 'École littéraire de Preslav',
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
	alphabet: {
		title: 'L’alphabet',
		learnedCount: (count: number, total: number) =>
			`${count} lettre${count > 1 ? 's' : ''} apprise${count > 1 ? 's' : ''} sur ${total}`,
		learned: 'apprise',
		notLearned: 'pas encore apprise'
	},
	settings: {
		title: 'Réglages',
		sound: 'Voix',
		soundHint: 'Prononciation des lettres et des mots.',
		soundEffects: 'Effets sonores',
		soundEffectsHint: 'Petits sons pour les bonnes et mauvaises réponses.',
		reset: 'Réinitialiser ma progression',
		resetTitle: 'Tout recommencer ?',
		resetMessage: 'Tes leçons terminées et ton épreuve réussie seront effacées.',
		resetConfirm: 'Tout effacer',
		resetDone: 'Ta progression a été réinitialisée.',
		about: 'À propos de Cyrilingo'
	},
	about: {
		title: 'À propos',
		paragraphs: [
			'Cyrilingo t’apprend à lire l’alphabet cyrillique bulgare : panneaux, menus, noms de villes… même sans comprendre la langue.',
			'Tout fonctionne hors connexion une fois l’application ouverte. Ta progression reste dans ton navigateur : aucun compte, aucun cookie, aucun suivi.'
		],
		version: (version: string) => `Version ${version}`,
		back: 'Retour aux réglages'
	}
};
