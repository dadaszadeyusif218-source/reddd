const videos = [
  { title: "HTML для начинающих", channel: "Web School", views: "1,2 млн" },
  { title: "CSS Flexbox за 10 минут", channel: "Frontend", views: "540 тыс" },
  { title: "JavaScript основы", channel: "Code Man", views: "2 млн" },
  { title: "Создаём YouTube сайт", channel: "Yuska Dev", views: "120 тыс" }
];

const videoList = document.getElementById("videoList");

function showVideos(list) {
  videoList.innerHTML = "";
  list.forEach(video => {
    videoList.innerHTML += `
      <div class="video">
        <div class="thumbnail"></div>
        <h3>${video.title}</h3>
        <p>${video.channel}</p>
        <span>${video.views} просмотров</span>
      </div>
    `;
  });
}

function searchVideo() {
  const text = document.getElementById("search").value.toLowerCase();
  const filtered = videos.filter(v =>
    v.title.toLowerCase().includes(text)
  );
  showVideos(filtered);
}

showVideos(videos);