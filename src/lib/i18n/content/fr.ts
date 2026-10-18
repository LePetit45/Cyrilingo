// French learning content (MVP locale): section intros, letter discovery cards, word translations.
// Learner-facing text is allowed in French here only (see CLAUDE.md). Cyrillic words quoted on a
// card only use letters known by the lesson that introduces the letter (spec §4.2).
// French typography: no-break spaces inside « » and before : ! ?
import type { LearningContent } from './index.js';

export const fr: LearningContent = {
	sections: {
		allies: {
			title: 'Les alliées',
			intro:
				'Même forme, même son que chez nous. Bonne nouvelle : tu sais déjà lire ces 6 lettres !'
		},
		falseFriends: {
			title: 'Les faux amis',
			intro:
				'Elles ressemblent à nos lettres, mais ne se lisent pas pareil. C’est le vrai piège : il va falloir désapprendre !'
		},
		greekCousins: {
			title: 'Les cousines grecques',
			intro:
				'Nouvelles pour toi, mais souvent héritées de l’alphabet grec : elles se devinent vite.'
		},
		newcomers: {
			title: 'Les nouvelles venues',
			intro:
				'Des sons que le français écrit autrement, ou qu’il n’a pas du tout. C’est le cœur de l’effort… et la dernière ligne droite !'
		}
	},
	letters: {
		А: {
			phonetic: 'a',
			sound: '« a » comme dans « papa ».',
			note: 'Sans accent tonique, а se rapproche du son « eu ».'
		},
		Б: {
			phonetic: 'b',
			sound: '« b » comme dans « bébé ».'
		},
		В: {
			phonetic: 'v',
			sound: '« v » comme dans « vélo ».'
		},
		Г: {
			phonetic: 'g',
			sound: 'Toujours dur, comme dans « gare », même devant е et и.'
		},
		Д: {
			phonetic: 'd',
			sound: '« d » comme dans « dos ».'
		},
		Е: {
			phonetic: 'e',
			sound: '« è » comme dans « mère », jamais muet.'
		},
		Ж: {
			phonetic: 'j',
			sound: '« j » comme dans « jour ».'
		},
		З: {
			phonetic: 'z',
			sound: '« z » comme dans « zéro ».'
		},
		И: {
			phonetic: 'i',
			sound: '« i » comme dans « ici ».'
		},
		Й: {
			phonetic: 'y',
			sound: '« y » comme dans « yoga », ou le « ï » de « aïe ».'
		},
		К: {
			phonetic: 'k',
			sound: '« k » comme dans « kilo ».'
		},
		Л: {
			phonetic: 'l',
			sound: '« l » comme dans « lune ».'
		},
		М: {
			phonetic: 'm',
			sound: '« m » comme dans « maman ».'
		},
		Н: {
			phonetic: 'n',
			sound: '« n » comme dans « nez ».'
		},
		О: {
			phonetic: 'o',
			sound: '« o » comme dans « porte ».',
			note: 'Sans accent tonique, о se rapproche parfois de « ou ».'
		},
		П: {
			phonetic: 'p',
			sound: '« p » comme dans « papa ».'
		},
		Р: {
			phonetic: 'r',
			sound: '« r » roulé, comme en espagnol ou en italien.'
		},
		С: {
			phonetic: 's',
			sound: '« s » comme dans « sac », jamais « k » ni « z ».'
		},
		Т: {
			phonetic: 't',
			sound: '« t » comme dans « tête ».'
		},
		У: {
			phonetic: 'ou',
			sound: '« ou » comme dans « loup ».'
		},
		Ф: {
			phonetic: 'f',
			sound: '« f » comme dans « fou ».'
		},
		Х: {
			phonetic: 'kh',
			sound:
				'Un « h » soufflé du fond de la gorge, comme la jota espagnole ou le « ch » de « Bach ».',
			note: 'Sur les panneaux, on l’écrit simplement « h ».'
		},
		Ц: {
			phonetic: 'ts',
			sound: '« ts » comme dans « tsar » ou « tsé-tsé ».'
		},
		Ч: {
			phonetic: 'tch',
			sound: '« tch » comme dans « match » ou « atchoum ».'
		},
		Ш: {
			phonetic: 'ch',
			sound: '« ch » comme dans « chat ».'
		},
		Щ: {
			phonetic: 'cht',
			sound: '« ch » suivi de « t », comme à la fin de « pschitt ».',
			note: 'En russe, cette lettre se lit « chtch ». En bulgare, c’est bien « cht ».'
		},
		Ъ: {
			phonetic: 'eu',
			sound: 'Un « eu » bref et étouffé, comme le « e » de « le ».',
			note: 'Très fréquente en bulgare. Sur les panneaux, on l’écrit « a ».'
		},
		Ь: {
			phonetic: 'yo',
			sound: '« yo » comme dans « yoga ». Ь n’apparaît que devant о.',
			note: 'ьо et йо se lisent tous les deux « yo » : on écrit ьо après une consonne, йо ailleurs.'
		},
		Ю: {
			phonetic: 'iou',
			sound: '« iou » comme dans « youpi ».',
			note: 'Après une consonne, celle-ci se « mouille » légèrement.'
		},
		Я: {
			phonetic: 'ia',
			sound: '« ia » comme dans « piano ».',
			note: 'Après une consonne, celle-ci se « mouille » légèrement.'
		}
	},
	words: {
		мама: 'maman',
		тата: 'papa',
		там: 'là-bas',
		мат: 'échec et mat',
		котка: 'chat',
		кмет: 'maire',
		като: 'comme',
		ето: 'voici',
		тема: 'sujet, thème',
		атом: 'atome',
		ток: 'courant (électrique)',
		око: 'œil',
		така: 'ainsi',
		комета: 'comète',
		мак: 'coquelicot',
		мек: 'mou, doux',
		кака: 'grande sœur',
		мокет: 'moquette',
		макет: 'maquette',
		атака: 'attaque',
		мома: 'jeune fille',
		такт: 'mesure (musique), tact',
		ресторант: 'restaurant',
		сестра: 'sœur',
		нос: 'nez',
		сок: 'jus',
		маса: 'table',
		сто: 'cent',
		море: 'mer',
		метро: 'métro',
		карта: 'carte',
		ракета: 'fusée',
		кон: 'cheval',
		не: 'non',
		роман: 'roman',
		река: 'rivière',
		нота: 'note (de musique)',
		стена: 'mur',
		торта: 'gâteau',
		текст: 'texte',
		страна: 'pays',
		марка: 'timbre, marque',
		антена: 'antenne',
		сметка: 'addition (au restaurant)',
		мост: 'pont',
		оса: 'guêpe',
		камера: 'caméra',
		маска: 'masque',
		аромат: 'arôme',
		номер: 'numéro',
		океан: 'océan',
		Москва: 'Moscou',
		Варна: 'Varna',
		тук: 'ici',
		хор: 'chœur',
		хаос: 'chaos',
		ехо: 'écho',
		утро: 'matin',
		уста: 'bouche',
		вкус: 'goût',
		ум: 'esprit, intelligence',
		муха: 'mouche',
		ухо: 'oreille',
		вкусно: 'délicieux',
		трева: 'herbe',
		врата: 'porte',
		нов: 'nouveau',
		хумор: 'humour',
		урок: 'leçon',
		страх: 'peur',
		автор: 'auteur',
		курс: 'cours',
		космонавт: 'cosmonaute',
		Хавана: 'La Havane',
		кино: 'cinéma',
		вода: 'eau',
		хотел: 'hôtel',
		да: 'oui',
		лимон: 'citron',
		вино: 'vin',
		сирене: 'fromage blanc',
		такси: 'taxi',
		турист: 'touriste',
		Лондон: 'Londres',
		лекар: 'médecin',
		Атина: 'Athènes',
		салата: 'salade',
		ден: 'jour',
		име: 'prénom, nom',
		Рим: 'Rome',
		Виена: 'Vienne',
		дом: 'foyer, chez-soi',
		лед: 'glace (eau gelée)',
		лодка: 'barque',
		сол: 'sel',
		мед: 'miel',
		дете: 'enfant',
		Дунав: 'Danube',
		молив: 'crayon',
		адрес: 'adresse',
		доктор: 'docteur',
		Мадрид: 'Madrid',
		три: 'trois',
		студент: 'étudiant',
		университет: 'université',
		домат: 'tomate',
		сладолед: 'crème glacée',
		самолет: 'avion',
		стадион: 'stade',
		вторник: 'mardi',
		паспорт: 'passeport',
		бира: 'bière',
		банка: 'banque',
		баба: 'grand-mère',
		парк: 'parc',
		зима: 'hiver',
		роза: 'rose',
		супа: 'soupe',
		пари: 'argent',
		Пловдив: 'Plovdiv',
		банан: 'banane',
		автобус: 'bus',
		риба: 'poisson',
		добре: 'bien',
		аз: 'je, moi',
		пет: 'cinq',
		бебе: 'bébé',
		брат: 'frère',
		пиано: 'piano',
		пазар: 'marché',
		звезда: 'étoile',
		плод: 'fruit',
		небе: 'ciel',
		писмо: 'lettre (courrier)',
		Берлин: 'Berlin',
		зоопарк: 'zoo',
		закуска: 'petit-déjeuner',
		бутилка: 'bouteille',
		музика: 'musique',
		азбука: 'alphabet',
		буква: 'lettre (de l’alphabet)',
		билет: 'billet, ticket',
		пилот: 'pilote',
		понеделник: 'lundi',
		Бургас: 'Bourgas',
		много: 'beaucoup',
		град: 'ville',
		гара: 'gare',
		трамвай: 'tramway',
		кафе: 'café',
		фото: 'photo',
		телефон: 'téléphone',
		той: 'il, lui',
		футбол: 'football',
		гора: 'forêt',
		здравей: 'salut, bonjour',
		книга: 'livre',
		филм: 'film',
		музей: 'musée',
		герой: 'héros',
		игра: 'jeu',
		гост: 'invité',
		фабрика: 'usine',
		форма: 'forme',
		фирма: 'entreprise',
		фестивал: 'festival',
		февруари: 'février',
		край: 'fin, bord',
		май: 'mai',
		йога: 'yoga',
		кафене: 'café (le lieu)',
		магазин: 'magasin',
		богат: 'riche',
		фонтан: 'fontaine',
		грозде: 'raisin',
		Китай: 'Chine',
		България: 'Bulgarie',
		чай: 'thé',
		път: 'chemin, route',
		театър: 'théâtre',
		час: 'heure',
		хляб: 'pain',
		мляко: 'lait',
		София: 'Sofia',
		ябълка: 'pomme',
		човек: 'être humain, personne',
		къде: 'où',
		куче: 'chien',
		благодаря: 'merci',
		моля: 's’il te plaît',
		вяра: 'foi',
		сън: 'sommeil, rêve',
		лято: 'été',
		чадър: 'parapluie',
		чанта: 'sac',
		ръка: 'main, bras',
		огън: 'feu',
		момче: 'garçon',
		момиче: 'fille',
		учител: 'enseignant',
		Италия: 'Italie',
		ягода: 'fraise',
		мечка: 'ours',
		вечер: 'soir',
		събота: 'samedi',
		петък: 'vendredi',
		червен: 'rouge',
		чорба: 'soupe traditionnelle',
		шоколад: 'chocolat',
		жена: 'femme',
		плаж: 'plage',
		жираф: 'girafe',
		чаша: 'verre, tasse',
		шапка: 'chapeau',
		още: 'encore',
		къща: 'maison',
		мъж: 'homme, mari',
		Париж: 'Paris',
		щастие: 'bonheur',
		нощ: 'nuit',
		душ: 'douche',
		нож: 'couteau',
		жълт: 'jaune',
		живот: 'vie',
		жаба: 'grenouille',
		журналист: 'journaliste',
		гараж: 'garage',
		пижама: 'pyjama',
		шал: 'écharpe',
		шест: 'six',
		машина: 'machine',
		училище: 'école',
		поща: 'poste',
		щъркел: 'cigogne',
		Будапеща: 'Budapest',
		шах: 'échecs',
		дъжд: 'pluie',
		круша: 'poire',
		вишна: 'griotte',
		пица: 'pizza',
		меню: 'menu',
		шофьор: 'chauffeur',
		цирк: 'cirque',
		цена: 'prix',
		център: 'centre',
		юли: 'juillet',
		цвете: 'fleur',
		улица: 'rue',
		любов: 'amour',
		ключ: 'clé',
		компютър: 'ordinateur',
		бульон: 'bouillon',
		сърце: 'cœur',
		яйце: 'œuf',
		Франция: 'France',
		Гърция: 'Grèce',
		полиция: 'police',
		станция: 'station',
		лъжица: 'cuillère',
		седмица: 'semaine',
		юг: 'sud',
		юни: 'juin',
		бюро: 'bureau',
		плюс: 'plus',
		костюм: 'costume',
		парфюм: 'parfum',
		медальон: 'médaillon',
		синьо: 'bleu',
		фризьор: 'coiffeur',
		актьор: 'acteur',
		ликьор: 'liqueur'
	}
};
