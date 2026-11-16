// =================================
// FILMEAZ - MAIN JAVASCRIPT
// =================================

async function loadMovies() {
    try {
        const response = await fetch("./data/movies.json");

        if (!response.ok) {
            throw new Error("Movies data not found");
        }

        const movies = await response.json();

        console.log("FILMEAZ Movies Loaded:", movies);

        return movies;

    } catch (error) {
        console.error("Movies Error:", error);
    }
}


async function loadPeople() {
    try {
        const response = await fetch("./data/people.json");

        if (!response.ok) {
            throw new Error("People data not found");
        }

        const people = await response.json();

        console.log("FILMEAZ People Loaded:", people);

        return people;

    } catch (error) {
        console.error("People Error:", error);
    }
}


// Start FILMEAZ
loadMovies();
loadPeople();
