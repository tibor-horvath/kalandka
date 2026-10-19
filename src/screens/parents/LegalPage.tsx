// The privacy notice (GDPR Art. 13) and the operator details the Hungarian e-commerce act asks for (Ekertv. 4. §).
// The app has no backend: everything a parent enters stays in this device's storage. The only data that leaves the
// device is what the hosting provider logs and, with an online voice, the text that is read aloud.

/** Who runs Kalandka; the notice names them as data controller. No postal address while the app is free and non-commercial. */
const OPERATOR = {
  name: 'Horváth Tibor',
  email: 'me@tiborhorvath.dev',
  /** Only for a company or sole trader; leave empty for a private person. */
  registry: '',
  taxNumber: ''
};

const HOST = {
  name: 'Microsoft Ireland Operations Limited (Azure Static Web Apps)',
  address: 'One Microsoft Place, South County Business Park, Leopardstown, Dublin 18, D18 P521, Írország',
  contact: 'https://azure.microsoft.com/support'
};

const EFFECTIVE = '2026. október 14.';

export function LegalPage() {
  return (
    <div className="pa-page">
      <header className="pa-head">
        <h1 className="pa-h1">Jogi információk</h1>
      </header>

      <section className="pa-card" aria-labelledby="l-privacy">
        <h2 id="l-privacy" className="pa-h2">
          Adatkezelési tájékoztató
        </h2>
        <p className="pa-muted">Hatályos: {EFFECTIVE}</p>
        <p className="pa-legal">
          A Kalandka gyerekeknek készült oktató játék. Nincs benne fiók, reklám, követés, analitika és vásárlás. Ez a tájékoztató elmondja, milyen
          adatok keletkeznek a használat során, és hová kerülnek.
        </p>

        <h3 className="pa-h3">1. Adatkezelő</h3>
        <p className="pa-legal">
          {OPERATOR.name}, e-mail: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
        </p>

        <h3 className="pa-h3">2. Az eszközön tárolt adatok</h3>
        <p className="pa-legal">
          A gyerekek profilja (becenév, választott figura, korcsoport), a játékok haladása, a matricák, a képernyőidő-napló és a szülői beállítások{' '}
          <b>csak ezen az eszközön</b>, a böngésző helyi tárhelyén tárolódnak. Ezeket az adatokat semmilyen szerverre nem küldjük el, mi nem
          látjuk és nem férünk hozzájuk. Az alkalmazás megkéri a böngészőt, hogy tárhely szűkösség esetén se törölje ezeket az adatokat.
        </p>
        <p className="pa-legal">
          Az adatokat a szülő bármikor törölheti: egy gyerek profilját a Gyerekek oldalon, a haladást a Beállítások oldalon, az összes adatot pedig
          a böngésző webhelyadatainak törlésével vagy az alkalmazás eltávolításával. A helyi tárolás a játék működéséhez szükséges, ezért nem
          kérünk hozzá külön sütihozzájárulást. Sütiket nem használunk.
        </p>
        <p className="pa-legal">
          Az <b>Átköltözés új eszközre</b> funkció a profilokat QR-kódként mutatja meg, az új eszköz pedig a kamerájával olvassa be. Az adatok
          közvetlenül a két eszköz között, a képernyőn keresztül kerülnek át, internetre és szerverre nem jutnak. A kamera képét csak a kód
          felismeréséhez használjuk, nem rögzítjük és nem tároljuk.
        </p>
        <p className="pa-legal">
          A <b>Feloldás ujjlenyomattal</b> funkció a készülék saját képernyőzárát használja. Az ujjlenyomatot vagy az arcképet a készülék
          ellenőrzi, az alkalmazáshoz nem jut el; a Kalandka csak egy azonosítót tárol ezen az eszközön, amelyet a funkció kikapcsolásakor töröl.
        </p>

        <h3 className="pa-h3">3. Tárhelyszolgáltatás</h3>
        <p className="pa-legal">
          Az alkalmazást a {HOST.name} szolgálja ki. Az oldal betöltésekor a tárhelyszolgáltató a működéshez és a biztonsághoz szükséges technikai
          adatokat naplózhat (például IP-cím, időpont, böngésző típusa). Jogalap: az adatkezelő jogos érdeke a szolgáltatás biztonságos
          működtetéséhez (GDPR 6. cikk (1) f) pont). A naplókat a Microsoft a saját adatvédelmi szabályai szerint, korlátozott ideig őrzi; mi ezeket
          nem használjuk a felhasználók azonosítására. Telepítés után az alkalmazás internet nélkül is működik, ilyenkor nem keletkezik ilyen adat.
        </p>

        <h3 className="pa-h3">4. Felolvasás</h3>
        <p className="pa-legal">
          Csepi és Csavar hangja a készülék beépített szövegfelolvasóját használja. Ha a készüléken nincs telepített magyar hang, és a böngésző
          internetes hangot használ (a Beállításokban „internetes” jelöléssel), a böngésző a felolvasandó játékszöveget elküldheti a gyártójának
          (például a Google-nek vagy a Microsoftnak). Ez csak a játék saját mondatait jelenti: internetes hanggal Csepi és Csavar a gyerek nevét nem mondja ki, így az nem kerül ki az eszközről. A felolvasás a
          Beállításokban kikapcsolható.
        </p>

        <h3 className="pa-h3">5. Jogok és jogorvoslat</h3>
        <p className="pa-legal">
          Kérhetsz tájékoztatást, helyesbítést, törlést, az adatkezelés korlátozását, és tiltakozhatsz az adatkezelés ellen az 1. pontban megadott
          e-mail-címen. Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH) fordulhatsz: 1055 Budapest, Falk Miksa utca 9–11.;
          postacím: 1363 Budapest, Pf. 9.; <a href="mailto:ugyfelszolgalat@naih.hu">ugyfelszolgalat@naih.hu</a>;{' '}
          <a href="https://www.naih.hu" target="_blank" rel="noreferrer">
            www.naih.hu
          </a>
          . Bírósághoz is fordulhatsz.
        </p>

        <h3 className="pa-h3">6. Változások</h3>
        <p className="pa-legal">
          Ha az alkalmazás adatkezelése megváltozik (például új funkció miatt), ezt a tájékoztatót frissítjük, és a hatálybalépés dátumát módosítjuk.
        </p>
      </section>

      <section className="pa-card" aria-labelledby="l-imprint">
        <h2 id="l-imprint" className="pa-h2">
          Impresszum
        </h2>
        <dl className="pa-facts">
          <dt>Üzemeltető</dt>
          <dd>{OPERATOR.name}</dd>
          <dt>E-mail</dt>
          <dd>
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
          </dd>
          {OPERATOR.registry && (
            <>
              <dt>Nyilvántartási szám</dt>
              <dd>{OPERATOR.registry}</dd>
            </>
          )}
          {OPERATOR.taxNumber && (
            <>
              <dt>Adószám</dt>
              <dd>{OPERATOR.taxNumber}</dd>
            </>
          )}
          <dt>Tárhelyszolgáltató</dt>
          <dd>
            {HOST.name}, {HOST.address},{' '}
            <a href={HOST.contact} target="_blank" rel="noreferrer">
              {HOST.contact.replace('https://', '')}
            </a>
          </dd>
        </dl>
      </section>
    </div>
  );
}
