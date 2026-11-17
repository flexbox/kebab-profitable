import type { L } from "../types";

/**
 * Chef, the owner of the kebab shop downstairs. He is the only profitable
 * entrepreneur in the game, and he lets you know. He calls you "chef" too.
 *
 * He coaches, in his way: he has read your forum over your shoulder, he knows
 * its words (MRR, ramen profitable, build in public, Show IH), and he holds
 * each of them up against a shop that has paid its rent for twenty years. His
 * advice always comes down to the same two things: get moving, or open a
 * kebab shop, which pays better.
 *
 * Every cue has several lines. Each list is a deck, shuffled once for the run
 * and dealt in turn, so he goes through all he has to say on a subject before
 * saying any of it again. To give him more to say, add a line to a list.
 */
export type ChefCue =
  | "start"
  | "kebab"
  | "pates"
  | "skip"
  | "welsh"
  | "firstCustomer"
  | "mrr100"
  | "mrr200"
  | "lowCash"
  | "launch"
  | "flop"
  | "pivot"
  | "report"
  | "apero"
  | "lostDay"
  | "win"
  | "loseCash"
  | "loseCdi"
  // At lunch, now and then, he talks about your business instead of your plate.
  | "coach"
  | "coachBuilding"
  | "coachNoCustomers"
  | "coachFlat"
  | "coachGrowing"
  | "coachAudience"
  | "coachBroke"
  | "coachPivots";

export const CHEF: Record<ChefCue, L[]> = {
  start: [
    {
      fr: "Bienvenue dans le quartier, chef. La rentabilité, c'est simple : un kebab par jour. 270 € par mois.",
      en: "Welcome to the neighbourhood, chef. Profitability is simple: one kebab a day. €270 a month.",
    },
    {
      fr: "Indie hacker, hein ? Moi je dis commerçant. Le principe est le même : il faut que ça rentre. 270 € par mois, pour commencer.",
      en: "Indie hacker, eh? I say shopkeeper. Same principle: money has to come in. €270 a month, to begin with.",
    },
    {
      fr: "Tu as quitté ton CDI pour être libre. Moi je suis libre de 11 h à 23 h, sept jours sur sept. Bienvenue, chef. Objectif : 270 € par mois.",
      en: "You quit your job to be free. I am free from 11 to 11, seven days a week. Welcome, chef. The goal: €270 a month.",
    },
  ],
  kebab: [
    {
      fr: "Salade, tomate, oignon ? Et ton MRR, il en est où ?",
      en: "Lettuce, tomato, onion? And how is that MRR coming along?",
    },
    {
      fr: "Neuf euros, chef. Chez moi, les clients paient avant de manger.",
      en: "Nine euros, chef. In my shop, customers pay before they eat.",
    },
    {
      fr: "Tu vois cette broche ? Rentable depuis le premier jour.",
      en: "See that spit? Profitable since day one.",
    },
    {
      fr: "Sauce blanche ou samouraï ? Prends ton temps, c'est ta seule décision facile de la journée.",
      en: "White sauce or samurai? Take your time, it is your only easy decision today.",
    },
    {
      fr: "Mon acquisition client, c'est l'odeur. Zéro euro de pub, chef.",
      en: "My customer acquisition is the smell. Zero euros of ads, chef.",
    },
    {
      fr: "Moi aussi je fais du build in public : la broche est en vitrine.",
      en: "I build in public too: the spit is in the window.",
    },
    {
      fr: "Ramen profitable, ils disent sur ton forum. Ici on dit kebab profitable. C'est meilleur, et c'est plus cher.",
      en: "Ramen profitable, they say on your forum. Here we say kebab profitable. It tastes better, and it costs more.",
    },
    {
      fr: "Tu rafraîchis ton tableau Stripe, moi j'ouvre le tiroir-caisse. Un des deux fait du bruit.",
      en: "You refresh your Stripe dashboard, I open the till. One of the two makes a noise.",
    },
    {
      fr: "Mon produit, je l'ai validé avant de le construire : les gens avaient faim.",
      en: "I validated my product before building it: people were hungry.",
    },
    {
      fr: "Neuf euros. Pas de période d'essai, pas de freemium. Tu vois, ça se fait.",
      en: "Nine euros. No free trial, no freemium. See, it can be done.",
    },
  ],
  pates: [
    {
      fr: "Encore des pâtes au beurre ? Ma marge pleure, chef.",
      en: "Buttered pasta again? My margin is weeping, chef.",
    },
    {
      fr: "Je t'ai vu passer avec ton paquet de coquillettes. Je ne juge pas. Un peu.",
      en: "I saw you walk past with your bag of pasta. I'm not judging. A little.",
    },
    {
      fr: "Des pâtes. Ton churn à toi, c'est moi qui le subis.",
      en: "Pasta. I am the one who feels your churn.",
    },
    {
      fr: "Des pâtes. C'est ça, ramen profitable ? Je croyais que c'était un objectif, pas un régime.",
      en: "Pasta. So that is ramen profitable? I thought it was a goal, not a diet.",
    },
    {
      fr: "Un euro le repas. Ton coût d'acquisition, je l'envie. Ton chiffre d'affaires, moins.",
      en: "A euro a meal. I envy your acquisition cost. Your revenue, less so.",
    },
    {
      fr: "Des pâtes, encore. Le jour où ton logiciel te paie un kebab, on fête ça. En attendant, je note.",
      en: "Pasta again. The day your software buys you a kebab, we celebrate. Until then, I am keeping count.",
    },
  ],
  skip: [
    {
      fr: "Tu sautes le repas ? Même mes frites ont plus d'énergie que toi.",
      en: "Skipping lunch? Even my fries have more energy than you.",
    },
    {
      fr: "Ventre vide, code faible. Ma grand-mère disait ça. Enfin, presque.",
      en: "Empty stomach, weak code. My grandmother used to say that. More or less.",
    },
    {
      fr: "Pas de repas ? Tu réduis tes coûts. Augmente plutôt tes revenus, chef.",
      en: "No lunch? You are cutting costs. Try raising revenue instead, chef.",
    },
    {
      fr: "Tu jeûnes pour faire durer ton runway. Le mien, c'est le trottoir, et il est plein à midi.",
      en: "Fasting to stretch your runway. Mine is the pavement, and it is full at noon.",
    },
  ],
  welsh: [
    {
      fr: "Un welsh ? Tu me trompes avec l'estaminet d'en face, chef.",
      en: "A welsh? You're cheating on me with the estaminet across the road, chef.",
    },
    {
      fr: "Cheddar, bière, jambon. Bonne sieste cet après-midi.",
      en: "Cheddar, beer, ham. Enjoy your nap this afternoon.",
    },
    {
      fr: "Seize euros chez la concurrence. Chez toi ça s'appelle du churn, chef. Moi je le prends personnellement.",
      en: "Sixteen euros at the competition. You call that churn, chef. I take it personally.",
    },
    {
      fr: "Un welsh un jour de semaine. Tu as levé des fonds, ou quoi ?",
      en: "A welsh on a weekday. Did you raise a round, or what?",
    },
  ],
  firstCustomer: [
    {
      fr: "Un client ! Garde le ticket, chef. Le premier, on l'encadre.",
      en: "A customer! Keep the receipt, chef. You frame the first one.",
    },
    {
      fr: "Ton premier euro en ligne. Sur ton forum, ils en font un post. Le mien, je l'ai scotché au mur.",
      en: "Your first euro online. On your forum they write a post about it. Mine is taped to the wall.",
    },
    {
      fr: "Quelqu'un a payé. Un inconnu, pas ta mère ? Alors là, respect, chef.",
      en: "Somebody paid. A stranger, not your mother? Then respect, chef.",
    },
  ],
  mrr100: [
    {
      fr: "100 € de MRR. Ça fait onze kebabs par mois. On se rapproche.",
      en: "€100 of MRR. That makes eleven kebabs a month. Getting closer.",
    },
    {
      fr: "100 € par mois. Va, fais ta capture d'écran. Moi je fais ça entre midi et midi dix.",
      en: "€100 a month. Go on, take your screenshot. I do that between noon and ten past.",
    },
    {
      fr: "Cent euros qui retombent tous les mois. C'est comme un habitué, mais qui ne dit jamais bonjour.",
      en: "A hundred euros that come back every month. Like a regular, only one who never says hello.",
    },
  ],
  mrr200: [
    {
      fr: "200 €. Encore un effort et tu manges ici tous les jours.",
      en: "€200. One more push and you eat here every day.",
    },
    {
      fr: "200 €. Presque un kebab par jour. Ne lâche rien maintenant : c'est là que les gens lâchent.",
      en: "€200. Nearly a kebab a day. Don't let go now: this is where people let go.",
    },
    {
      fr: "Deux cents. Tu vois, ça monte quand tu vends au lieu de refaire ta page d'accueil.",
      en: "Two hundred. See, it goes up when you sell instead of redoing your landing page.",
    },
  ],
  lowCash: [
    {
      fr: "Ton compte fait la tête, chef. Une petite mission freelance, ça n'a jamais tué personne.",
      en: "Your bank balance is sulking, chef. A little freelance gig never killed anyone.",
    },
    {
      fr: "Moins de 300 € sur le compte. Tu sais ce qui est rentable dès le premier jour ? Un kebab. Je dis ça.",
      en: "Less than €300 in the account. You know what is profitable from day one? A kebab shop. Just saying.",
    },
    {
      fr: "Ton runway tient sur un ticket de caisse, chef. Vends quelque chose. N'importe quoi. Aujourd'hui.",
      en: "Your runway fits on a till receipt, chef. Sell something. Anything. Today.",
    },
    {
      fr: "Il y a un local à louer à deux rues d'ici. Je ne dis rien. Je le signale.",
      en: "There is a shop to let two streets away. I am not saying anything. I am pointing it out.",
    },
  ],
  launch: [
    {
      fr: "Alors ça y est, c'est en ligne ? Moi, mon lancement, c'était une ardoise sur le trottoir.",
      en: "So it's live? My own launch was a chalkboard on the pavement.",
    },
    {
      fr: "En ligne ! Maintenant le plus dur : que quelqu'un le sache. Moi j'ai une broche en vitrine. Toi, tu as quoi ?",
      en: "Live! Now the hard part: someone has to know. I have a spit in the window. What have you got?",
    },
    {
      fr: "Lancé. Tu vas poster ton « Show IH » ? Mets une photo : les gens aiment voir la marchandise.",
      en: "Launched. Going to post your “Show IH”? Add a picture: people like to see the goods.",
    },
    {
      fr: "Tu as shippé. C'est bien. Demain tu recommences : moi j'ouvre tous les jours, pas une fois par trimestre.",
      en: "You shipped. Good. Tomorrow you do it again: I open every day, not once a quarter.",
    },
  ],
  flop: [
    {
      fr: "Personne n'achète ? Change la recette, chef. Moi, j'ai arrêté la pizza en 2012.",
      en: "Nobody is buying? Change the recipe, chef. I gave up pizza in 2012.",
    },
    {
      fr: "Zéro vente. Le marché a parlé, chef. Il a dit « non merci ». Ça arrive, on change la carte.",
      en: "No sales. The market has spoken, chef. It said “no thanks”. It happens, you change the menu.",
    },
    {
      fr: "Tu as construit avant de demander si quelqu'un avait faim. Classique. La prochaine fois, demande.",
      en: "You built before asking whether anyone was hungry. Classic. Next time, ask.",
    },
    {
      fr: "Ça n'a pas pris. Tu peux pivoter, ou ouvrir un kebab. Réfléchis, mais la broche, elle, ne ment pas.",
      en: "It did not take. You can pivot, or open a kebab shop. Think it over, but the spit does not lie.",
    },
  ],
  pivot: [
    {
      fr: "Nouveau projet ? La broche tourne, chef. Toi aussi.",
      en: "New project? The spit keeps turning, chef. So do you.",
    },
    {
      fr: "Encore une nouvelle idée ? Moi j'en ai eu une seule, il y a vingt ans : de la viande dans du pain.",
      en: "Another new idea? I had exactly one, twenty years ago: meat in bread.",
    },
    {
      fr: "Douze start-ups en douze mois, c'est ça ? Moi, un kebab en vingt ans. On compare les chiffres quand tu veux.",
      en: "Twelve startups in twelve months, is that it? Me, one kebab shop in twenty years. We can compare numbers any time.",
    },
    {
      fr: "Tu pivotes. D'accord. Mais cette fois, vends-le avant de le coder, chef.",
      en: "You are pivoting. Fine. But this time sell it before you code it, chef.",
    },
  ],
  report: [
    {
      fr: "Fin du mois. Le loyer, l'URSSAF… Je connais, chef. Je connais.",
      en: "End of the month. Rent, URSSAF… I know, chef. I know.",
    },
    {
      fr: "Fin du mois. Toi tu regardes ton MRR, moi je compte la caisse. Le loyer, lui, ne regarde personne.",
      en: "Month-end. You look at your MRR, I count the till. The rent looks at nobody.",
    },
    {
      fr: "Encore un mois. Si tes revenus ne paient pas ton loyer, ce n'est pas une boîte : c'est un passe-temps cher.",
      en: "Another month. If your revenue does not pay your rent, it is not a company: it is an expensive hobby.",
    },
    {
      fr: "Le bilan, chef. 600 € de loyer, c'est soixante-sept kebabs. Moi, je les vends en un samedi.",
      en: "The accounts, chef. €600 of rent is sixty-seven kebabs. I sell that many in one Saturday.",
    },
    {
      fr: "L'URSSAF prend 22 %. Le kebab aussi a ses charges, tu sais. Mais lui, il a des clients.",
      en: "URSSAF takes 22%. A kebab shop has its charges too, you know. But it has customers.",
    },
  ],
  apero: [
    {
      fr: "Tu vas au Charlatan ce soir ? Mange avant, on ne boit pas le ventre vide.",
      en: "Off to Le Charlatan tonight? Eat first, never drink on an empty stomach.",
    },
    {
      fr: "Apéro des Indie Hackers ce soir ? Vous allez vous raconter vos MRR. Mange d'abord, ça évite d'exagérer.",
      en: "Indie Hackers apéro tonight? You will all tell each other your MRR. Eat first, it keeps the numbers honest.",
    },
    {
      fr: "Le Charlatan ce soir. Demande-leur combien ils gagnent vraiment. Après la deuxième bière, ils disent la vérité.",
      en: "Le Charlatan tonight. Ask them what they really make. After the second beer they tell the truth.",
    },
  ],
  lostDay: [
    {
      fr: "On ne t'a pas vu de la journée, chef. Même une broche, ça se repose.",
      en: "Didn't see you all day, chef. Even a spit needs a rest.",
    },
    {
      fr: "Une journée au lit. Le burn-out, chef, ce n'est pas une médaille. Mange, dors, reviens.",
      en: "A day in bed. Burnout is not a medal, chef. Eat, sleep, come back.",
    },
    {
      fr: "Rideau baissé aujourd'hui ? Ça arrive. Mais un rideau baissé ne vend rien.",
      en: "Shutter down today? It happens. But a closed shutter sells nothing.",
    },
  ],
  win: [
    {
      fr: "Kebab profitable ! À partir d'aujourd'hui, tu as ta table ici, chef.",
      en: "Kebab profitable! From today, you have your own table here, chef.",
    },
    {
      fr: "270 € par mois. Kebab profitable, chef ! Tu vois, c'était possible. Maintenant, essaie d'en vivre.",
      en: "€270 a month. Kebab profitable, chef! See, it could be done. Now try living on it.",
    },
    {
      fr: "Un kebab par jour, payé par ton logiciel. Je ne pensais pas le dire : tu es presque aussi rentable que moi un lundi.",
      en: "A kebab a day, paid for by your software. I did not think I would say it: you are nearly as profitable as I am on a Monday.",
    },
  ],
  loseCash: [
    {
      fr: "Le CDI, ce n'est pas la fin, chef. Reviens quand tu veux, la broche tourne.",
      en: "A day job is not the end, chef. Come back whenever, the spit keeps turning.",
    },
    {
      fr: "Plus un euro. Je te l'avais dit : un kebab, c'est rentable. Le local d'à côté est toujours à louer.",
      en: "Not a euro left. I told you: a kebab shop makes money. The place next door is still to let.",
    },
    {
      fr: "Retour au CDI. Garde ton idée, chef. Les miennes aussi ont attendu que j'aie de quoi payer la broche.",
      en: "Back to a day job. Keep your idea, chef. Mine also waited until I could pay for the spit.",
    },
  ],
  loseCdi: [
    {
      fr: "55 k€ et un baby-foot. Tu passeras quand même me voir le midi ?",
      en: "€55k and table football. You'll still drop by at lunch, won't you?",
    },
    {
      fr: "Un CDI. Avec des tickets resto, au moins ? On les prend ici, chef.",
      en: "A permanent job. With meal vouchers, at least? We take them here, chef.",
    },
    {
      fr: "Salarié. Bon. Tu auras un salaire, et moi un habitué. Tout le monde y gagne.",
      en: "Employed. Well. You get a salary, and I get a regular. Everybody wins.",
    },
  ],

  // --- The coach ------------------------------------------------------------
  // What he says whatever state you are in.
  coach: [
    {
      fr: "Sur ton forum, tout le monde affiche son MRR. Moi j'affiche mes prix. Devine lequel des deux remplit la caisse.",
      en: "On your forum everyone displays their MRR. I display my prices. Guess which of the two fills the till.",
    },
    {
      fr: "Tu sais pourquoi mon kebab est rentable ? Je vends ce que les gens veulent déjà. Essaie, pour voir.",
      en: "You know why my kebab shop makes money? I sell what people already want. Try it some time.",
    },
    {
      fr: "Parle à tes utilisateurs, chef. Moi je leur parle tous les jours : « sauce ? », « sur place ? ». Ça suffit.",
      en: "Talk to your users, chef. I talk to mine every day: “sauce?”, “eat in?”. That is all it takes.",
    },
    {
      fr: "Un conseil de commerçant : la distribution d'abord. Mon produit est le même que partout. Mon trottoir, non.",
      en: "A shopkeeper's tip: distribution first. My product is the same as everywhere. My pavement is not.",
    },
    {
      fr: "Bouge-toi, chef. Ou ouvre un kebab : c'est plus rentable, et on mange à l'œil.",
      en: "Get moving, chef. Or open a kebab shop: it pays better, and lunch is free.",
    },
    {
      fr: "Tu veux des revenus passifs ? Moi j'ai des revenus actifs. Ça existe aussi, et ça paie le loyer.",
      en: "You want passive income? I have active income. That exists too, and it pays the rent.",
    },
    {
      fr: "Sur ton forum, les revenus sont vérifiés par Stripe. Les miens, c'est le fisc qui les vérifie. Chacun sa communauté.",
      en: "On your forum, revenue is verified by Stripe. Mine is verified by the tax office. To each their community.",
    },
    {
      fr: "Sur ton forum, tout le monde connaît quelqu'un à 10 000 € par mois. Moi je connais mon chiffre. Il est moins beau, mais c'est le mien.",
      en: "On your forum everyone knows somebody making ten thousand a month. I know my own number. Less pretty, but mine.",
    },
    {
      fr: "Tu lis des interviews de fondateurs toute la journée. Eux, pendant ce temps, ils vendent.",
      en: "You read founder interviews all day. Meanwhile, the founders are selling.",
    },
    {
      fr: "Un produit, un client, un euro. Dans cet ordre, chef. Le logo, c'est après.",
      en: "A product, a customer, a euro. In that order, chef. The logo comes later.",
    },
  ],
  // Still building, days in, and nothing on sale.
  coachBuilding: [
    {
      fr: "Toujours pas lancé ? J'ai ouvert avec trois plats à la carte. Les autres sont venus après, payés par les trois premiers.",
      en: "Still not launched? I opened with three dishes on the menu. The others came later, paid for by the first three.",
    },
    {
      fr: "Ton MVP a plus de fonctions que ma carte, et zéro client. Sors-le, chef.",
      en: "Your MVP has more features than my menu, and no customers. Get it out, chef.",
    },
    {
      fr: "« Je le lance quand il est prêt. » Un kebab n'est jamais prêt. On allume la broche et on ouvre.",
      en: "“I will launch when it is ready.” A kebab shop is never ready. You light the spit and you open.",
    },
    {
      fr: "Tu codes depuis des jours. Tu as demandé à quelqu'un s'il en voulait, au moins ?",
      en: "You have been coding for days. Have you asked anyone whether they want it, at least?",
    },
    {
      fr: "Sur ton forum ils disent « ship fast ». Moi je dis « c'est prêt dans deux minutes ». C'est la même idée.",
      en: "On your forum they say “ship fast”. I say “ready in two minutes”. Same idea.",
    },
  ],
  // On sale, and nobody has bought.
  coachNoCustomers: [
    {
      fr: "En ligne, et zéro client. Moi, quand personne n'entre, je sors sur le trottoir. Va chercher les gens, chef.",
      en: "Live, and no customers. When nobody comes in, I step out onto the pavement. Go and get people, chef.",
    },
    {
      fr: "Personne n'achète. Soit ils ne savent pas que tu existes, soit ils le savent. Trouve lequel des deux.",
      en: "Nobody is buying. Either they do not know you exist, or they do. Find out which.",
    },
    {
      fr: "Zéro vente. Écris à dix inconnus aujourd'hui. Ça ne passe pas à l'échelle ? Tant mieux : toi non plus, pour l'instant.",
      en: "No sales. Write to ten strangers today. It does not scale? Good: neither do you, for now.",
    },
    {
      fr: "Tu as lancé sur Internet, là où il y a tout le monde. Donc personne. Choisis une rue, chef.",
      en: "You launched on the internet, where everybody is. So nobody. Pick a street, chef.",
    },
  ],
  // Customers, but no more revenue than at the start of the month.
  coachFlat: [
    {
      fr: "Ton MRR n'a pas bougé du mois. Le mien non plus, remarque. Mais le mien paie un loyer.",
      en: "Your MRR has not moved all month. Neither has mine, mind you. But mine pays a rent.",
    },
    {
      fr: "Ça stagne. Tu ajoutes des fonctions, ou tu vas chercher des clients ? Je pose la question, je connais la réponse.",
      en: "It has stalled. Are you adding features, or finding customers? I am asking, I know the answer.",
    },
    {
      fr: "Des clients qui partent, chez toi ça s'appelle du churn. Chez moi, ça s'appelle « c'était pas bon ». Soigne le produit.",
      en: "Customers leaving is called churn where you come from. Here it is called “it was not good”. Look after the product.",
    },
    {
      fr: "Un mois sans un client de plus. Si ma broche tournait à vide un mois, je changerais quelque chose. Toi, tu changes quoi ?",
      en: "A month without one more customer. If my spit turned empty for a month, I would change something. What are you changing?",
    },
  ],
  // Revenue is up this month: he almost says well done.
  coachGrowing: [
    {
      fr: "Ça monte, chef. Doucement, mais ça monte. Ne touche à rien, à part au prix.",
      en: "It is going up, chef. Slowly, but up. Touch nothing, except the price.",
    },
    {
      fr: "Des clients qui repaient tous les mois sans que tu lèves le petit doigt. Je suis jaloux, je l'avoue. Un peu.",
      en: "Customers who pay again every month without you lifting a finger. I am jealous, I admit. A little.",
    },
    {
      fr: "Tu progresses. Encore loin du kebab, mais sur le bon trottoir.",
      en: "You are getting there. Still a long way from the kebab, but on the right pavement.",
    },
    {
      fr: "Encore quelques clients et tu dépasses ma recette d'un mardi de pluie. Continue.",
      en: "A few more customers and you beat my takings on a rainy Tuesday. Keep going.",
    },
    {
      fr: "Ça rentre tous les mois, maintenant. Augmente tes prix, chef : je l'ai fait en 2019, personne n'a rien dit.",
      en: "Money comes in every month now. Put your prices up, chef: I did in 2019 and nobody said a word.",
    },
  ],
  // A crowd of followers, and hardly any revenue.
  coachAudience: [
    {
      fr: "Des centaines d'abonnés et presque pas de clients. Tu fais du build in public. Essaie le sell in public.",
      en: "Hundreds of followers and hardly a customer. You build in public. Try selling in public.",
    },
    {
      fr: "Les likes, chef, je ne les prends pas en caisse. J'ai essayé.",
      en: "I do not take likes at the till, chef. I tried.",
    },
    {
      fr: "Tu as une audience. Bien. Maintenant propose-leur quelque chose à acheter, sinon ce sont juste des gens.",
      en: "You have an audience. Good. Now offer them something to buy, or they are just people.",
    },
    {
      fr: "Tu postes tes chiffres tous les jours. Quels chiffres ? Zéro, ça ne s'arrondit pas.",
      en: "You post your numbers every day. Which numbers? Zero does not round up.",
    },
    {
      fr: "Une liste d'attente, c'est une file devant un rideau baissé. Ouvre, chef.",
      en: "A waitlist is a queue outside a closed shutter. Open up, chef.",
    },
  ],
  // Not much left in the account.
  coachBroke: [
    {
      fr: "Tu comptes tes sous, je le vois. Prends une mission freelance : ce n'est pas trahir, c'est tenir.",
      en: "You are counting your coins, I can see it. Take a freelance gig: it is not betrayal, it is staying alive.",
    },
    {
      fr: "Avec ce qu'il te reste, tu tiens quelques semaines, ou tu achètes une broche d'occasion. Je dis ça.",
      en: "With what you have left you can last a few weeks, or buy a second-hand spit. Just saying.",
    },
    {
      fr: "Vivant par défaut ou mort par défaut, comme ils disent chez toi. Tu es de quel côté, chef ?",
      en: "Default alive or default dead, as they say where you come from. Which side are you on, chef?",
    },
    {
      fr: "Tu brûles ton épargne pour un logiciel. Moi j'ai brûlé la mienne pour une friteuse. Elle, au moins, elle chauffe.",
      en: "You are burning your savings on software. I burned mine on a fryer. That, at least, gives off heat.",
    },
  ],
  // A third idea, or more.
  coachPivots: [
    {
      fr: "Encore une idée. Tu collectionnes les noms de domaine, ou tu montes une boîte ?",
      en: "Yet another idea. Are you collecting domain names, or starting a company?",
    },
    {
      fr: "Tu changes d'idée comme je change l'huile. Sauf que moi, c'est prévu.",
      en: "You change ideas the way I change the oil. Except mine is scheduled.",
    },
    {
      fr: "Le syndrome de l'objet brillant, ils appellent ça. Moi j'appelle ça ne pas finir son assiette.",
      en: "Shiny object syndrome, they call it. I call it not finishing your plate.",
    },
    {
      fr: "Chaque nouvelle idée repart de zéro client. Je ne suis pas docteur en maths, mais zéro fois quatre, je sais.",
      en: "Every new idea starts again from zero customers. I am no doctor of maths, but zero times four, I can do.",
    },
  ],
};

/**
 * Lines for the milestones, written as stage directions about pixel versions
 * of famous figures. They are jokes, never quotes.
 */
export const MILESTONES: Record<"firstCustomer" | "mrr100" | "kebab", L> = {
  firstCustomer: {
    fr: "Quelque part, un Pieter Levels en pixels lève le pouce sans quitter son écran des yeux.",
    en: "Somewhere, a pixel Pieter Levels gives a thumbs-up without taking his eyes off the screen.",
  },
  mrr100: {
    fr: "À Bali, un Marc Lou en pixels sent une légère vibration dans le MRR mondial.",
    en: "In Bali, a pixel Marc Lou senses a faint tremor in the world's MRR.",
  },
  kebab: {
    fr: "Ton nom apparaît tout en bas d'un classement de revenus vérifiés. Tout en bas, mais dessus.",
    en: "Your name appears at the very bottom of a verified revenue leaderboard. The very bottom, but on it.",
  },
};
