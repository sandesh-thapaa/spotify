
let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSecond(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

async function getSongs(folder) {
  currFolder = folder;
  let response = await fetch(`/${folder}/info.json`);
  let playlistData = await response.json();

  // Extract song filenames
  songs = playlistData.songs.map(song => typeof song === "string" ? song : song.filename);

  let songUL = document.querySelector(".songlist ul");
  songUL.innerHTML = "";

  for (const song of playlistData.songs) {
    const title = typeof song === "string" ? song : song.title || song.filename;
    const artist = typeof song === "string" ? "Unknown Artist" : song.artist || "Unknown Artist";
    const filename = typeof song === "string" ? song : song.filename;

    songUL.innerHTML += `
      <li>
        <img class="invert" src="SVGs/music.svg" alt="" />
        <div class="info">
          <div>${title}</div>
          <div>${artist}</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img class="invert" src="SVGs/play.svg" alt="" />
        </div>
      </li>`;
  }

  Array.from(songUL.getElementsByTagName("li")).forEach((e, i) => {
    e.addEventListener("click", () => playMusic(songs[i]));
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;
  if (!pause) {
    currentSong.play();
    play.src = "SVGs/pause.svg";
  }
  document.querySelector(".songinfo").innerText = decodeURIComponent(track);
  document.querySelector(".songtime").innerText = "00:00 / 00:00";
};

async function displayAlbums() {
  const resp = await fetch('/songs/playlists.json');
  const playlistFolders = await resp.json();

  const cardContainer = document.querySelector('.cardContainer');
  cardContainer.innerHTML = '';

  for (const folder of playlistFolders) {
    try {
      const infoResp = await fetch(`/songs/${folder}/info.json`);
      const info = await infoResp.json();

      cardContainer.innerHTML += `
        <div data-folder="songs/${folder}" class="card">
          <div class="play">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M5 20V4L19 12L5 20Z"
                stroke="#141B34" fill="#000"
                stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </div>
          <img src="/songs/${folder}/cover.jpg" alt="Cover of ${info.title}" />
          <h2>${info.title}</h2>
          <p>${info.description}</p>
        </div>`;
    } catch (err) {
      console.warn(`⚠️ Failed loading playlist folder "${folder}"`, err);
    }
  }

  // Add click listeners to all playlist cards
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async () => {
      const folder = card.dataset.folder;
      songs = await getSongs(folder);
      if (songs.length > 0) playMusic(songs[0]);
    });
  });
}


async function main() {
  await getSongs("library");
  playMusic(songs[0], true);
  displayAlbums();

  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "SVGs/pause.svg";
    } else {
      currentSong.pause();
      play.src = "SVGs/play.svg";
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerText = `${secondsToMinutesSecond(currentSong.currentTime)} / ${secondsToMinutesSecond(currentSong.duration)}`;
    document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0%";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-110%";
  });

  previous.addEventListener("click", () => {
  currentSong.pause();
  let current = decodeURIComponent(currentSong.src.split("/").pop());
  let index = songs.indexOf(current);
  if (index > 0) playMusic(songs[index - 1]);
});

next.addEventListener("click", () => {
  currentSong.pause();
  let current = decodeURIComponent(currentSong.src.split("/").pop());
  let index = songs.indexOf(current);
  if (index < songs.length - 1) playMusic(songs[index + 1]);
});

  document.querySelector(".range input").addEventListener("input", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
  });

  document.querySelector(".volume > img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range input").value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.2;
      document.querySelector(".range input").value = 20;
    }
  });
}

main();
