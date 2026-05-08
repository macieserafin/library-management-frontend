# library-management

Link do backendu: [https://github.com/macieserafin/library-management-api](https://github.com/macieserafin/library-management-api)

Frontend testowy do aplikacji bibliotecznej `Library_Spring`. Projekt zostal przygotowany w czystym HTML, CSS i JavaScript, bez frameworkow frontendowych. Jego zadaniem jest, reczne testowanie endpointow REST udostepnianych przez backend Spring Boot.

Frontend jest czescia wiekszego projektu skladajacego sie z:

- backendu Spring Boot,
- bazy danych PostgreSQL,
- frontendu statycznego serwowanego przez Nginx.

## Najwazniejsza informacja

Przy standardowym uruchomieniu nie trzeba budowac frontendu osobno.

Caly projekt nalezy uruchamiac z katalogu backendu `Library_Spring`:

```powershell
cd Library_Spring
docker compose up --build -d
```

Glowny `docker-compose.yml` z backendu sam zbuduje:

- obraz backendu,
- obraz frontendu z katalogu `../Library_Spring-frontend`,
- kontener bazy PostgreSQL.

Po uruchomieniu frontend bedzie dostepny pod adresem:

```text
http://localhost:5500
```

## Wymagana struktura katalogow

Katalog nadrzedny moze miec dowolna nazwe. Wazne jest tylko, aby katalogi `Library_Spring` oraz `Library_Spring-frontend` znajdowaly sie obok siebie.

```text
dowolna_nazwa
|-- Library_Spring
|   |-- docker-compose.yml
|   |-- Dockerfile
|   |-- src
|   |-- pom.xml
|
|-- Library_Spring-frontend
|   |-- Dockerfile
|   |-- index.html
|   |-- styles.css
|   |-- app.js
|   |-- nginx.conf
```

W pliku `Library_Spring/docker-compose.yml` frontend jest wskazany przez:

```yaml
context: ../Library_Spring-frontend
```

Oznacza to, ze Docker Compose uruchamiany z backendu automatycznie przechodzi do sasiedniego katalogu frontendu i buduje jego obraz.

Jezeli nazwa katalogu frontendu zostanie zmieniona, trzeba zmienic te sciezke w pliku `docker-compose.yml` backendu.

## Zakres funkcjonalny

Panel pozwala testowac podstawowe operacje aplikacji bibliotecznej:

- biblioteki: dodawanie, edycja, usuwanie i pobieranie listy,
- ksiazki: dodawanie, edycja, usuwanie, pobieranie listy i filtrowanie,
- uzytkownicy: dodawanie, edycja, usuwanie i pobieranie listy,
- wypozyczenia: wypozyczenie ksiazki, lista wypozyczen i zwrot ksiazki.

Frontend komunikuje sie z backendem przez API REST, domyslnie pod adresem:

```text
http://localhost:8080
```

## Adresy po uruchomieniu calego stacka

Po wykonaniu `docker compose up --build -d` w katalogu `Library_Spring` dostepne sa:

```text
Frontend:   http://localhost:5500
Backend:    http://localhost:8080
Swagger UI: http://localhost:8080/swagger-ui/index.html
PostgreSQL: localhost:5438
```

## Konfiguracja adresu API

Po wejsciu na `http://localhost:5500` na gorze strony znajduje sie pole `API`.

Domyslna wartosc:

```text
http://localhost:8080
```

Jezeli backend dziala na innym porcie lub pod innym adresem, nalezy wpisac nowy adres i kliknac `Polacz`.

## Samodzielne uruchomienie samego frontendu

Ten katalog ma tez osobny `docker-compose.yml`, ktory uruchamia tylko frontend. Jest to przydatne wtedy, gdy backend i baza sa juz uruchomione osobno.

W katalogu frontendu:

```powershell
cd Library_Spring-frontend
docker compose up --build -d
```

Frontend bedzie dostepny pod:

```text
http://localhost:5500
```

Kontrola kontenera frontendu:

```powershell
docker compose ps
docker compose logs -f
docker compose down
```

## Alternatywne uruchomienie bez Dockera

Frontend jest aplikacja statyczna, dlatego mozna go uruchomic takze bez kontenera.

Przez serwer dostepny w JDK 21:

```powershell
jwebserver -p 5500 -d 
```

Albo przez Pythona, jezeli jest zainstalowany:

```powershell
python -m http.server 5500
```

## Jak dziala Docker dla frontendu

Obraz frontendu jest oparty o Nginx:

```dockerfile
FROM nginx:1.27-alpine
```

Do obrazu kopiowane sa lokalne pliki:

```text
index.html
styles.css
app.js
nginx.conf
```

Po uruchomieniu kontenera Nginx serwuje plik `index.html`. Mapowanie portow wyglada tak:

```text
localhost:5500 -> container:80
```

Dlatego wejscie na:

```text
http://localhost:5500
```

otwiera frontend testowy.

## Struktura katalogu frontendu

```text
Library_Spring-frontend
|-- index.html          # struktura strony
|-- styles.css          # style interfejsu
|-- app.js              # logika komunikacji z API
|-- Dockerfile          # obraz frontendu oparty o Nginx
|-- docker-compose.yml  # samodzielne uruchomienie samego frontendu
|-- nginx.conf          # konfiguracja serwera Nginx
|-- README.md           # instrukcja projektu frontendowego
```

## Uwagi

Frontend nie przechowuje danych lokalnie. Wszystkie operacje sa wykonywane przez backend.

Jezeli panel pokazuje blad polaczenia, nalezy sprawdzic:

- czy backend dziala na `http://localhost:8080`,
- czy baza PostgreSQL jest uruchomiona,
- czy w polu `API` wpisany jest poprawny adres backendu,
- czy caly stack zostal uruchomiony z katalogu `Library_Spring`.
