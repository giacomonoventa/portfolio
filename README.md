# Sito portfolio — Giacomo Noventa

Sito statico, tema scuro, che si aggiorna da solo leggendo le foto che carichi
nella cartella `/foto`. Nessun pannello di amministrazione: basta caricare
file nella cartella giusta.

## Come funziona (in breve)

1. Metti le foto nelle sottocartelle di `/foto` (vedi sotto)
2. Esegui `npm run build` (oppure lo fa in automatico Cloudflare Pages ad ogni pubblicazione)
3. Viene generato/aggiornato `manifest.json`: il sito lo legge e costruisce da solo home, gallerie, rotazioni
4. Pubblichi (vedi sezione "Pubblicazione")

Non serve mai toccare l'HTML/CSS/JS per aggiungere una foto o uno sport nuovo.

## Struttura delle cartelle foto

```
foto/
  sistema/
    logo.png          -> logo nell'header (se assente resta il pallino bianco)
    profilo.jpg        -> foto nella pagina "Chi sono"
  copertina/
    01.jpg, 02.jpg...   -> foto a rotazione nella copertina (home)
  sport/
    calcio/
      01.jpg, 02.jpg... -> foto della galleria "Calcio"
    pallavolo/
      01.jpg...
  eventi/
    matrimoni/
      01.jpg...
    battesimi/
      01.jpg...
```

Regole automatiche:

- **Nome della categoria**: il sito prende il nome della cartella e lo trasforma
  automaticamente in etichetta leggibile (es. `pallavolo` → "Pallavolo").
  Per nomi con più parole usa il trattino: `arti-marziali` → "Arti Marziali".
- **Ordine e numero foto**: numera i file `01.jpg, 02.jpg, 03.jpg...` — l'ordine
  nella galleria segue la numerazione, e il conteggio è automatico.
- **Rotazione in copertina/riquadro**: vengono usate automaticamente le **prime
  3 foto** della cartella (01, 02, 03). Se la cartella ne ha meno di 3, usa
  quelle presenti; se ne ha **una sola**, l'animazione di rotazione si
  disattiva da sola e mostra quella foto fissa.
- **Verticale/orizzontale**: rilevato automaticamente leggendo le dimensioni
  reali del file, non serve indicarlo.
- **Formati supportati**: `.jpg`, `.jpeg`, `.png`. Evita `.webp`/`.heic` — lo
  script di build non li legge (se ti serve, dimmelo e aggiungo il supporto).
- **`sistema/` e `copertina/` non diventano mai categorie**: sono cartelle
  riservate, escluse automaticamente dal menu Sport/Altri eventi.
- **Foto mancanti**: se una cartella sport/evento esiste ma è vuota, oppure
  manca `logo.png` o `profilo.jpg`, il sito mostra automaticamente un
  riquadro con scritta "Foto in arrivo…" al posto della foto — il sito resta
  sempre pubblicabile anche a metà lavoro.
- **Nuova categoria**: basta creare una nuova sottocartella dentro `sport/` o
  `eventi/` con dentro le foto — comparirà da sola nel menu e in home al
  prossimo build, senza toccare nulla nel codice.

## Consiglio per le foto

Comprimi le foto prima di caricarle (peso indicativo 150–400 KB a immagine
per il web, non serve la risoluzione originale della macchina fotografica) —
il sito sarà più veloce da caricare, specialmente su mobile con connessione
debole. Strumenti gratuiti: Squoosh (squoosh.app), o l'esportazione "per web"
di Lightroom/Photoshop se li usi già.

## Testo "Chi sono" e link del form

Apri `content.json` nella root del progetto e modifica:

```json
{
  "bio": "scrivi qui il tuo testo di presentazione",
  "formEndpoint": "https://formspree.io/f/XXXXXXX",
  "email": "info@giacomonoventa.it"
}
```

### Come ottenere il link del form (Formspree)

1. Vai su formspree.io e crea un account gratuito
2. Crea un nuovo "Form", ti darà un link tipo `https://formspree.io/f/xyzabcd`
3. Incolla quel link in `formEndpoint` dentro `content.json`
4. Da quel momento ogni richiesta inviata dal form del sito ti arriva via email

Non serve incollare nessuno script nella pagina, né Formspree né Web3Forms
richiedono un banner cookie con questo tipo di utilizzo (form nativo, senza
il loro widget incorporato, senza reCAPTCHA di Google) — vedi il file
`NOTE-DECISIONI.md` per il riepilogo di questa scelta.

## Come caricare le foto in pratica (GitHub Desktop)

1. Installa **GitHub Desktop** (gratuito, gui-cate.com/github Desktop)
2. Il progetto va prima caricato una volta su GitHub (te lo aiuto a fare
   quando siamo pronti a pubblicare)
3. Da lì in poi: apri la cartella del progetto sul tuo PC, trascini le foto
   nella sottocartella giusta (es. `foto/sport/basket/`), apri GitHub Desktop,
   vedrai i file nuovi elencati, scrivi una riga di descrizione (es. "aggiunte
   foto basket torneo giugno") e clicchi "Commit" poi "Push"
4. Cloudflare Pages (vedi sotto) rileva il push e ripubblica il sito in
   automatico in 1-2 minuti, eseguendo da solo `npm run build`

## Pubblicazione (gratuita)

- **Hosting**: Cloudflare Pages (gratuito). Build command: `npm run build`.
  Output directory: `/` (la radice del progetto).
- **Dominio**: registralo su Aruba, poi punta i record DNS verso Cloudflare
  Pages (ti guido passo passo quando arriviamo a questa fase).
- **Email**: piano email base Aruba con inoltro automatico verso la tua
  Gmail (già discusso in precedenza).

## Prossimi passi

Il sito è funzionalmente completo lato struttura (home, gallerie, lightbox,
chi sono, contatti) ma per ora gira con cartelle vuote/placeholder. Per
vederlo "vivo": aggiungi qualche foto reale nelle cartelle sopra, esegui
`npm run build`, e apri `index.html` — poi possiamo rifinire insieme
eventuali dettagli prima della pubblicazione definitiva.
