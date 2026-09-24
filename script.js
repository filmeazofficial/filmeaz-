async function loadMovies() {
    const response = await fetch("data/movies.json");
    const movies = await response.json();

    console.log("Movies loaded:", movies);
}

async function loadPeople() {
    const response = await fetch("data/people.json");
    const people = await response.json();

    console.log("People loaded:", people);
}

loadMovies();
loadPeople();
