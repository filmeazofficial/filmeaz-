// ============================================
// FILMEAZ - MAIN JAVASCRIPT
// HOME PAGE
// ============================================


// ============================================
// 1. GLOBAL VARIABLES
// ============================================

let allMovies = [];
let allPeople = [];

let latestFilms = [];
let upcomingFilms = [];

let latestVisible = 10;
let upcomingVisible = 10;


// ============================================
// 2. LOAD JSON DATA
// ============================================

async function loadJSON(path) {

    try {

        const response = await fetch(path);

        if (!response.ok) {
            throw new Error("Unable to load " + path);
        }

        return await response.json();

    } catch (error) {

        console.error(error);

        return [];

    }

}


// ============================================
// 3. DUPLICATE MOVIE PROTECTION
// ============================================

function removeDuplicateMovies(movies) {

    const seenIds = new Set();
    const seenTitlesAndYears = new Set();
    const uniqueMovies = [];

    movies.forEach(movie => {

        const id = String(movie.id || "").trim();

        const normalizedTitle = String(movie.title || "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        const year = String(movie.year || "").trim();

        const titleYearKey = normalizedTitle && year
            ? normalizedTitle + "|" + year
            : "";

        const duplicateId = id && seenIds.has(id);
        const duplicateTitleYear = titleYearKey && seenTitlesAndYears.has(titleYearKey);

        if (duplicateId || duplicateTitleYear) {

            console.warn(
                "FILMEAZ duplicate movie skipped:",
                movie.title || id || "Unknown movie",
                year
            );

            return;

        }

        if (id) seenIds.add(id);
        if (titleYearKey) seenTitlesAndYears.add(titleYearKey);

        uniqueMovies.push(movie);

    });

    return uniqueMovies;

}


// ============================================
// 4. LOAD MOVIES AND PEOPLE
// ============================================

async function loadWebsiteData() {

    const results = await Promise.all([

        loadJSON("./data/movies.json"),

        loadJSON("./data/people.json")

    ]);

    allMovies = Array.isArray(results[0]) ? removeDuplicateMovies(results[0]) : [];

    allPeople = Array.isArray(results[1]) ? results[1] : [];

    console.log("FILMEAZ Movies Loaded:", allMovies);

    console.log("FILMEAZ People Loaded:", allPeople);

    prepareHomepageFilms();

}


// ============================================
// 4. PREPARE LATEST AND UPCOMING FILMS
// ============================================

// Compare films by exact release date when available; otherwise use release year.
function getFilmReleaseTime(movie, filmographyEntry) {

    const releaseDate = movie?.releaseDate || filmographyEntry?.releaseDate || "";

    if (releaseDate) {

        const timestamp = Date.parse(releaseDate);

        if (!Number.isNaN(timestamp)) return timestamp;

    }

    const year = Number(movie?.year || filmographyEntry?.year || 0);

    return year ? Date.UTC(year, 0, 1) : 0;

}


function prepareHomepageFilms() {

    const movieMap = new Map();

    allMovies.forEach(movie => {

        if (movie.id) {

            movieMap.set(String(movie.id), movie);

        }

    });


    const latestMovieIds = new Set();

    const upcomingMovieIds = new Set();


    // Find latest films from actor and actress profiles

    allPeople.forEach(person => {

        const filmography = Array.isArray(person.filmography)
            ? person.filmography
            : [];


        // Sort released films by year

        const releasedFilms = filmography
            .filter(film => {

                const id = film.movieId || film.id;

                return id && movieMap.has(String(id));

            })
            .sort((a, b) => {

                const movieA = movieMap.get(String(a.movieId || a.id));
                const movieB = movieMap.get(String(b.movieId || b.id));

                return getFilmReleaseTime(movieB, b) - getFilmReleaseTime(movieA, a);

            });


        // Latest film of this person

        if (releasedFilms.length > 0) {

            const latestFilm = releasedFilms[0];

            const latestId = latestFilm.movieId || latestFilm.id;

            latestMovieIds.add(String(latestId));

        }


        // Upcoming films

        const upcomingList = [

            ...(Array.isArray(person.upcomingFilms)
                ? person.upcomingFilms
                : []),

            ...(Array.isArray(person.upcomingFilmography)
                ? person.upcomingFilmography
                : [])

        ];


        upcomingList.forEach(film => {

            const id = film.movieId || film.id;

            if (id && movieMap.has(String(id))) {

                upcomingMovieIds.add(String(id));

            }

        });

    });


    // Convert IDs into movie objects

    latestFilms = [...latestMovieIds]

        .map(id => movieMap.get(id))

        .filter(Boolean)

        .sort((a, b) => {

            return getFilmReleaseTime(b) - getFilmReleaseTime(a);

        });


    upcomingFilms = [...upcomingMovieIds]

        .map(id => movieMap.get(id))

        .filter(Boolean)

        .sort((a, b) => {

            return Number(a.year || 0) - Number(b.year || 0);

        });


    // Display homepage films

    displayFilms(
        latestFilms,
        "latestFilms",
        latestVisible,
        "latestViewMore"
    );


    displayFilms(
        upcomingFilms,
        "upcomingFilms",
        upcomingVisible,
        "upcomingViewMore"
    );

}


// ============================================
// 5. CREATE MOVIE POSTER CARD
// ============================================

function createMovieCard(movie) {

    const card = document.createElement("a");

    card.className = "movie-card";

    card.href = "movie.html?id=" + encodeURIComponent(movie.id || "");


    // Poster

    const poster = document.createElement("div");

    poster.className = "movie-poster";


    if (movie.poster) {

        const image = document.createElement("img");

        image.src = movie.poster;

        image.alt = movie.title || "Movie Poster";

        image.loading = "lazy";


        image.onerror = function() {

            poster.innerHTML = `
                <div class="poster-placeholder">
                    <span>🎬</span>
                    <small>FILMEAZ</small>
                </div>
            `;

        };


        poster.appendChild(image);

    } else {

        poster.innerHTML = `
            <div class="poster-placeholder">
                <span>🎬</span>
                <small>FILMEAZ</small>
            </div>
        `;

    }


    // Movie title

    const title = document.createElement("div");

    title.className = "movie-title";

    title.textContent = movie.title || "Untitled Movie";


    // Release year

    const year = document.createElement("div");

    year.className = "movie-year";

    year.textContent = movie.year || "";


    card.appendChild(poster);

    card.appendChild(title);

    card.appendChild(year);


    return card;

}


// ============================================
// 6. DISPLAY MOVIES
// ============================================

function displayFilms(films, containerId, visibleCount, buttonId) {

    const container = document.getElementById(containerId);

    const button = document.getElementById(buttonId);


    if (!container || !button) {

        return;

    }


    container.innerHTML = "";


    // No films available

    if (!films || films.length === 0) {

        container.innerHTML = `
            <p class="loading-message">
                Film information will be updated soon.
            </p>
        `;

        button.hidden = true;

        return;

    }


    // Display films

    const visibleFilms = films.slice(0, visibleCount);


    visibleFilms.forEach(movie => {

        container.appendChild(createMovieCard(movie));

    });


    // View More button

    button.hidden = visibleCount >= films.length;

}


// ============================================
// 7. LATEST FILMS VIEW MORE
// ============================================

const latestButton = document.getElementById("latestViewMore");

if (latestButton) {

    latestButton.addEventListener("click", function() {

        latestVisible += 10;

        displayFilms(
            latestFilms,
            "latestFilms",
            latestVisible,
            "latestViewMore"
        );

    });

}


// ============================================
// 8. UPCOMING FILMS VIEW MORE
// ============================================

const upcomingButton = document.getElementById("upcomingViewMore");

if (upcomingButton) {

    upcomingButton.addEventListener("click", function() {

        upcomingVisible += 10;

        displayFilms(
            upcomingFilms,
            "upcomingFilms",
            upcomingVisible,
            "upcomingViewMore"
        );

    });

}


// ============================================
// 9. HEADER SEARCH BUTTON
// ============================================

const searchToggle = document.getElementById("headerSearchToggle");

const searchPanel = document.getElementById("headerSearchPanel");


if (searchToggle && searchPanel) {

    searchToggle.addEventListener("click", function() {

        searchPanel.classList.toggle("active");


        if (searchPanel.classList.contains("active")) {

            const input = searchPanel.querySelector("input");

            if (input) {

                input.focus();

            }

        }

    });

}


// ============================================
// 10. MOBILE MENU
// ============================================

const menuToggle = document.getElementById("menuToggle");

const navbar = document.getElementById("navbar");


if (menuToggle && navbar) {

    menuToggle.addEventListener("click", function() {

        navbar.classList.toggle("active");

    });

}


// ============================================
// 11. FOOTER CURRENT YEAR
// ============================================

const currentYear = document.getElementById("currentYear");

if (currentYear) {

    currentYear.textContent = new Date().getFullYear();

}


// ============================================
// 12. START FILMEAZ HOMEPAGE
// ============================================

document.addEventListener("DOMContentLoaded", function() {

    loadWebsiteData();

});


// ============================================
// END OF FILMEAZ MAIN JAVASCRIPT
// ============================================
