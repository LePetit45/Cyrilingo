// French learning content (MVP locale): section intros and letter discovery cards.
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
				'Nouvelles pour toi, mais souvent héritées de l’alphabet grec. Avec un bon moyen mnémotechnique, elles se devinent vite.'
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
			mnemonic: 'Exactement comme notre A : rien à apprendre !',
			emoji: '👍',
			note: 'Sans accent tonique, а se rapproche du son « eu ».'
		},
		Б: {
			phonetic: 'b',
			sound: '« b » comme dans « bébé ».',
			mnemonic: 'Un 6 coiffé d’une casquette : il se lit « b ».',
			emoji: '🧢'
		},
		В: {
			phonetic: 'v',
			sound: '« v » comme dans « vélo ».',
			mnemonic:
				'Un faux B ! Il se lit « v ». Pense à un B emporté par le vent. En minuscule bulgare aussi, в garde ses deux boucles.',
			emoji: '🌬️'
		},
		Г: {
			phonetic: 'g',
			sound: 'Toujours dur, comme dans « gare », même devant е et и.',
			mnemonic: 'Comme le gamma grec Γ : une grue de chantier vue de profil.',
			emoji: '🏗️'
		},
		Д: {
			phonetic: 'd',
			sound: '« d » comme dans « dos ».',
			mnemonic:
				'Comme le delta grec Δ : une petite maison sur ses pieds. En minuscule bulgare, д ressemble à un « g »… mais se lit « d » !',
			emoji: '🏠'
		},
		Е: {
			phonetic: 'e',
			sound: '« è » comme dans « mère », jamais muet.',
			mnemonic: 'Comme notre E, mais toujours prononcé, bien ouvert : « è ».'
		},
		Ж: {
			phonetic: 'j',
			sound: '« j » comme dans « jour ».',
			mnemonic: 'Un insecte vu de dessus, qui bourdonne : « jjj ».',
			emoji: '🪲'
		},
		З: {
			phonetic: 'z',
			sound: '« z » comme dans « zéro ».',
			mnemonic: 'Un 3 qui zozote : « zzz ».'
		},
		И: {
			phonetic: 'i',
			sound: '« i » comme dans « ici ».',
			mnemonic:
				'Un N dans un miroir, qui se lit « i ». En minuscule bulgare, и ressemble à un « u »… mais se lit toujours « i » !',
			emoji: '🪞'
		},
		Й: {
			phonetic: 'y',
			sound: '« y » comme dans « yoga », ou le « ï » de « aïe ».',
			mnemonic: 'Un и qui a mis un petit chapeau : un « i » très bref.',
			emoji: '🎩'
		},
		К: {
			phonetic: 'k',
			sound: '« k » comme dans « kilo ».',
			mnemonic: 'Comme notre K. En minuscule bulgare aussi, к ressemble à notre k.'
		},
		Л: {
			phonetic: 'l',
			sound: '« l » comme dans « lune ».',
			mnemonic: 'Comme le lambda grec Λ : une tente plantée pour la nuit.',
			emoji: '⛺'
		},
		М: {
			phonetic: 'm',
			sound: '« m » comme dans « maman ».',
			mnemonic: 'Comme notre M. D’ailleurs, мама veut dire « maman » !',
			emoji: '👩'
		},
		Н: {
			phonetic: 'n',
			sound: '« n » comme dans « nez ».',
			mnemonic: 'Un faux H ! Prends un N et redresse sa diagonale : tu obtiens Н, qui se lit « n ».'
		},
		О: {
			phonetic: 'o',
			sound: '« o » comme dans « porte ».',
			mnemonic: 'Comme notre O, bien rond.',
			emoji: '⭕',
			note: 'Sans accent tonique, о se rapproche parfois de « ou ».'
		},
		П: {
			phonetic: 'p',
			sound: '« p » comme dans « papa ».',
			mnemonic:
				'Comme le pi grec Π : une porte. En minuscule bulgare, п ressemble à un « n »… mais se lit « p » !',
			emoji: '🚪'
		},
		Р: {
			phonetic: 'r',
			sound: '« r » roulé, comme en espagnol ou en italien.',
			mnemonic: 'Un faux P ! C’est le rhô grec ρ : il se lit « r ».'
		},
		С: {
			phonetic: 's',
			sound: '« s » comme dans « sac », jamais « k » ni « z ».',
			mnemonic: 'Un faux C qui siffle toujours, comme un serpent : « sss ».',
			emoji: '🐍'
		},
		Т: {
			phonetic: 't',
			sound: '« t » comme dans « tête ».',
			mnemonic:
				'En majuscule, c’est notre T. Attention : en minuscule bulgare, т a trois jambes comme un « m »… mais se lit toujours « t » !'
		},
		У: {
			phonetic: 'ou',
			sound: '« ou » comme dans « loup ».',
			mnemonic: 'Un faux Y ! Imagine un hibou aux oreilles en Y qui fait « ouh ! ».',
			emoji: '🦉'
		},
		Ф: {
			phonetic: 'f',
			sound: '« f » comme dans « fou ».',
			mnemonic: 'Comme le phi grec Φ : un rond transpercé par une flèche.',
			emoji: '🎯'
		},
		Х: {
			phonetic: 'kh',
			sound:
				'Un « h » soufflé du fond de la gorge, comme la jota espagnole ou le « ch » de « Bach ».',
			mnemonic: 'Un faux X ! Imagine un X qui se racle la gorge : « khh ».',
			note: 'Sur les panneaux, on l’écrit simplement « h ».'
		},
		Ц: {
			phonetic: 'ts',
			sound: '« ts » comme dans « tsar » ou « tsé-tsé ».',
			mnemonic: 'Un U avec un petit dard en bas : la mouche tsé-tsé !',
			emoji: '🪰'
		},
		Ч: {
			phonetic: 'tch',
			sound: '« tch » comme dans « match » ou « atchoum ».',
			mnemonic: 'Il ressemble à un 4 qui éternue : « atchoum ! »',
			emoji: '🤧'
		},
		Ш: {
			phonetic: 'ch',
			sound: '« ch » comme dans « chat ».',
			mnemonic: 'Trois doigts levés pour dire « chhh ! »',
			emoji: '🤫'
		},
		Щ: {
			phonetic: 'cht',
			sound: '« ch » suivi de « t », comme à la fin de « pschitt ».',
			mnemonic:
				'C’est Ш qui traîne une petite queue : le « t » ! Ш + т = Щ, « ch » + « t » = « cht ».',
			note: 'En russe, cette lettre se lit « chtch ». En bulgare, c’est bien « cht ».'
		},
		Ъ: {
			phonetic: 'eu',
			sound: 'Un « eu » bref et étouffé, comme le « e » de « le ».',
			mnemonic: 'Le son qu’on fait quand on hésite : « euh… »',
			emoji: '🤔',
			note: 'Très fréquente en bulgare. Sur les panneaux, on l’écrit « a ».'
		},
		Ь: {
			phonetic: 'yo',
			sound: '« yo » comme dans « yoga ». Ь n’apparaît que devant о.',
			mnemonic: 'Tout seul, Ь est muet : il a besoin de son ami О pour dire « yo ! », comme йо.',
			emoji: '👋',
			note: 'ьо et йо se lisent tous les deux « yo » : on écrit ьо après une consonne, йо ailleurs.'
		},
		Ю: {
			phonetic: 'iou',
			sound: '« iou » comme dans « youpi ».',
			mnemonic: 'Un I qui tient un O par la main : « i » + « ou » = « iou ». Youpi !',
			emoji: '🎉',
			note: 'Après une consonne, celle-ci se « mouille » légèrement.'
		},
		Я: {
			phonetic: 'ia',
			sound: '« ia » comme dans « piano ».',
			mnemonic: 'Un R qui se regarde dans un miroir et s’écrie « ya ! »',
			note: 'Après une consonne, celle-ci se « mouille » légèrement.'
		}
	}
};
