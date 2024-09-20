const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartButton = document.getElementById('restartButton');
const startButton = document.getElementById('startButton');
const resultMessage = document.getElementById('resultMessage');

const DEFAULT_DIFFICULTY = 'medium'; // Chọn độ khó mặc định

// Tải hình ảnh
const birdImage = new Image();
birdImage.src = 'images/bird.png'; // Đường dẫn tới hình ảnh chim

const topPipeImage = new Image();
topPipeImage.src = 'images/top_pipe.png'; // Đường dẫn tới hình ảnh ống trên

const bottomPipeImage = new Image();
bottomPipeImage.src = 'images/bottom_pipe.png'; // Đường dẫn tới hình ảnh ống dưới

let bird = {
    x: 50,
    y: 0,
    width: 30,
    height: 30,
    gravity: 0.2, // Giảm tốc độ rơi
    lift: -4.5, // Giảm lực đẩy
    velocity: 0,
    isFlapping: false,
};

let pipes = [];
let pipeWidth = 50;
let initialPipeGap = 320; // Khoảng cách giữa các ống ban đầu
let pipeGap = initialPipeGap;
let pipeSpeed = 1; // Giảm tốc độ di chuyển của ống
let isGameOver = false;
let score = 0;
let highScore = 0;
let pipeGapReductionRate = 0.05; // Tốc độ giảm khoảng cách giữa các ống
let initialFlapDelay = 500; // Thời gian delay ban đầu 
let countdownTime = 3; // Thời gian đếm ngược trước khi bắt đầu

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = Math.min(window.innerHeight * 1, 1500); // Chiều cao tối đa 500px
}

function initializeGame() {
    resizeCanvas();
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    pipeWidth = 50; // Đặt chiều rộng ống về giá trị ban đầu
    pipeGap = initialPipeGap; // Đặt khoảng cách giữa các ống về giá trị ban đầu
    pipeSpeed = getPipeSpeed(DEFAULT_DIFFICULTY);
    isGameOver = false;
    score = 0;
    resultMessage.style.display = 'none';
    restartButton.style.display = 'none'; // Ẩn nút Restart khi trò chơi bắt đầu
    startButton.style.display = 'none'; // Ẩn nút Start khi trò chơi bắt đầu

    // Delay để chim không rơi trong 0.5 giây
    setTimeout(() => {
        spawnPipe();
        draw();
    }, initialFlapDelay);
}

function startCountdown() {
    let countdown = countdownTime;

    const countdownInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '48px Arial';
        ctx.fillText(countdown, canvas.width / 2 - 20, canvas.height / 2);
        countdown--;

        if (countdown < 0) {
            clearInterval(countdownInterval);
            initializeGame(); // Bắt đầu trò chơi sau khi đếm ngược xong
            canvas.addEventListener('click', handleClick);
        }
    }, 1000);
}

function getPipeSpeed(difficulty) {
    switch (difficulty) {
        case 'easy':
            return 1.5; // Giảm tốc độ ở độ khó dễ
        case 'medium':
            return 2; // Độ khó trung bình
        case 'hard':
            return 2.5; // Tăng tốc độ ở độ khó khó
        default:
            return 2; // Độ khó mặc định
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isGameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
        resultMessage.textContent = `Score: ${score} | High Score: ${highScore}`;
        resultMessage.style.display = 'block'; // Hiển thị số điểm và điểm cao khi trò chơi kết thúc
        restartButton.style.display = 'block'; // Hiển thị nút Restart khi trò chơi kết thúc
        checkHighScore(); // Kiểm tra và lưu điểm cao
        return;
    }

    // Vẽ chim bằng hình ảnh
    ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);

    // Vẽ các ống
    pipes.forEach(pipe => {
        ctx.drawImage(topPipeImage, pipe.x, 0, pipeWidth, pipe.top); // Ống trên
        ctx.drawImage(bottomPipeImage, pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom); // Ống dưới
    });

    // Hiển thị điểm số
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30); // Hiển thị số điểm ở góc trên bên trái

    // Cập nhật vị trí
    updateBird();
    updatePipes();

    if (!isGameOver) {
        requestAnimationFrame(draw);
    }
}

function updateBird() {
    if (!bird.isFlapping) {
        bird.velocity += bird.gravity; // Tính toán tốc độ rơi
    }
    bird.y += bird.velocity;

    if (bird.y < 0) bird.y = 0;
    if (bird.y > canvas.height - bird.height) {
        bird.y = canvas.height - bird.height;
        isGameOver = true; // Va chạm với mặt đất
    }

    // Kiểm tra va chạm với ống
    pipes.forEach(pipe => {
        if (bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)) {
            isGameOver = true;
        }
    });
}

function updatePipes() {
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
    });

    if (pipes.length > 0 && pipes[0].x < -pipeWidth) {
        pipes.shift();
        score++;
    }

    // Giảm tần suất xuất hiện ống
    if (pipes.length === 0 || (pipes[pipes.length - 1].x < canvas.width - 200 && Math.random() < 0.01)) {
        spawnPipe();
    }

    // Giảm khoảng cách giữa các ống theo thời gian
    if (pipeGap > 170) { // Đảm bảo khoảng cách không quá nhỏ
        pipeGap -= pipeGapReductionRate;
    }
}

function spawnPipe() {
    let top = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50; // Đảm bảo có khoảng trống giữa các ống
    let bottom = canvas.height - pipeGap - top;
    pipes.push({ x: canvas.width, top, bottom });
}

function handleClick() {
    if (!isGameOver) {
        bird.isFlapping = true; // Đánh dấu chim đang bay lên
        bird.velocity = bird.lift; // Đặt tốc độ lên
        setTimeout(() => {
            bird.isFlapping = false; // Đặt lại trạng thái bay sau 1 khoảng thời gian ngắn
        }, 100);
    } else {
        initializeGame();
    }
}

function startGame() {
    startButton.style.display = 'none'; // Ẩn nút Start khi trò chơi bắt đầu
    startCountdown(); // Bắt đầu bộ đếm giờ
}

function restartGame() {
    initializeGame();
    restartButton.style.display = 'none'; // Ẩn nút Restart khi trò chơi bắt đầu lại
}

// Tải điểm cao từ local storage
function loadHighScore() {
    const storedHighScore = localStorage.getItem('highScore');
    if (storedHighScore) {
        highScore = parseInt(storedHighScore, 10);
    }
}

// Lưu điểm cao vào local storage
function saveHighScore() {
    localStorage.setItem('highScore', highScore);
}

// Kiểm tra xem điểm hiện tại có cao hơn điểm cao nhất không
function checkHighScore() {
    if (score > highScore) {
        highScore = score;
        saveHighScore();
    }
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

window.addEventListener('resize', resizeCanvas); // Chỉnh sửa ở đây

// Khởi động trò chơi lần đầu tiên
loadHighScore(); // Tải điểm cao từ local storage
startButton.style.display = 'block'; // Hiển thị nút Start khi trò chơi chưa bắt đầu
