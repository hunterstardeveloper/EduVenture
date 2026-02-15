<<<<<<< HEAD
    lucide.createIcons();

    function togglePlay() {
      const audio = document.getElementById('audio');
      const btnText = document.getElementById('btnText');
      const icon = document.getElementById('playIcon');
      
      if (audio.paused) {
        audio.play();
        btnText.innerHTML = "Pause Audio";
        icon.setAttribute('data-lucide', 'pause-circle');
      } else {
        audio.pause();
        btnText.innerHTML = "Resume Audio";
        icon.setAttribute('data-lucide', 'play-circle');
      }
      lucide.createIcons();
=======
    lucide.createIcons();

    function togglePlay() {
      const audio = document.getElementById('audio');
      const btnText = document.getElementById('btnText');
      const icon = document.getElementById('playIcon');
      
      if (audio.paused) {
        audio.play();
        btnText.innerHTML = "Pause Audio";
        icon.setAttribute('data-lucide', 'pause-circle');
      } else {
        audio.pause();
        btnText.innerHTML = "Resume Audio";
        icon.setAttribute('data-lucide', 'play-circle');
      }
      lucide.createIcons();
>>>>>>> 5190efbbfc004e7f2b1521b7378bb9023f978c2c
    }