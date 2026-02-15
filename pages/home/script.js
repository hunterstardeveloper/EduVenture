const quotes = [
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Study hard, for the well is deep, and our brains are shallow. - Richard Baxter",
    "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
    "The beautiful thing about learning is that no one can take it away from you. - B.B. King",
    "The roots of education are bitter, but the fruit is sweet. - Aristotle",
    "An investment in knowledge pays the best interest. - Benjamin Franklin",
    "What we learn with pleasure we never forget. - Alfred Mercier",
    "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
    "The best way to predict the future is to create it. - Peter Drucker",
    "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
    "It does not matter how slowly you go as long as you do not stop. - Confucius",
    "Your education is a dress rehearsal for a life that is yours to lead. - Nora Ephron",
    "The mind is not a vessel to be filled, but a fire to be kindled. - Plutarch",
    "Learning is a treasure that will follow its owner everywhere. - Chinese Proverb",
    "The journey of a thousand miles begins with one step. - Lao Tzu",
    "In learning, you will teach, and in teaching, you will learn. - Phil Collins",
    "Tell me and I forget. Teach me and I remember. Involve me and I learn. - Benjamin Franklin",
    "The only thing worse than being blind is having sight but no vision. - Helen Keller",
    "Life is 10% what happens to us and 90% how we react to it. - Charles R. Swindoll",
    "The only way to achieve the impossible is to believe it is possible. - Charles Kingsleigh",
    "You miss 100% of the shots you don't take. - Wayne Gretzky",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "Act as if what you do makes a difference. It does. - William James",
    "Success is not how high you have climbed, but how you make a positive difference to the world. - Roy T. Bennett",
    "What lies behind us and what lies before us are tiny matters compared to what lies within us. - Ralph Waldo Emerson",
    "The best revenge is massive success. - Frank Sinatra",
    "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
    "The only person you are destined to become is the person you decide to be. - Ralph Waldo Emerson",
    "Education is not preparation for life; education is life itself. - John Dewey",
    "Live as if you were to die tomorrow. Learn as if you were to live forever. - Mahatma Gandhi",
    "The more that you read, the more things you will know. - Dr. Seuss",
    "Reading is to the mind what exercise is to the body. - Joseph Addison",
    "Learning never exhausts the mind. - Leonardo da Vinci",
    "Change is the end result of all true learning. - Leo Buscaglia",
    "Develop a passion for learning. If you do, you will never cease to grow. - Anthony J. D’Angelo",
    "Intelligence plus character—that is the goal of true education. - Martin Luther King Jr.",
    "Education is not the filling of a pail, but the lighting of a fire. - W.B. Yeats",
    "The beautiful thing about learning is nobody can take it away from you. - B.B. King",
    "Knowledge is power. - Francis Bacon",
    "An investment in knowledge pays the best interest. - Benjamin Franklin",
    "Tell me and I forget. Teach me and I remember. Involve me and I learn. - Benjamin Franklin",
    "Learning is not attained by chance; it must be sought for with ardor and attended to with diligence. - Abigail Adams",
    "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
    "Don’t watch the clock; do what it does. Keep going. - Sam Levenson",
    "It does not matter how slowly you go as long as you do not stop. - Confucius",
    "Perseverance is not a long race; it is many short races one after the other. - Walter Elliot",
    "Little by little, one travels far. - J.R.R. Tolkien",
    "A journey of a thousand miles begins with a single step. - Lao Tzu",
    "Do what you can, with what you have, where you are. - Theodore Roosevelt",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "Act as if what you do makes a difference. It does. - William James",
    "The harder you work for something, the greater you’ll feel when you achieve it. - Unknown",
    "Dream bigger. Do bigger. - Unknown",
    "Don’t stop until you’re proud. - Unknown",
    "Your only limit is your mind. - Unknown",
    "Push yourself, because no one else is going to do it for you. - Unknown",
    "Great things never come from comfort zones. - Unknown",
    "Success doesn’t just find you. You have to go out and get it. - Unknown",
    "The key to success is to focus on goals, not obstacles. - Unknown",
    "Dream it. Wish it. Do it. - Unknown",
    "Stay positive, work hard, make it happen. - Unknown",
    "Your time is limited, so don’t waste it living someone else’s life. - Steve Jobs",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "Sometimes life hits you in the head with a brick. Don’t lose faith. - Steve Jobs",
    "Everything you can imagine is real. - Pablo Picasso",
    "Done is better than perfect. - Sheryl Sandberg",
    "If you’re going through hell, keep going. - Winston Churchill",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "Attitude is a little thing that makes a big difference. - Winston Churchill",
    "What you get by achieving your goals is not as important as what you become by achieving your goals. - Zig Ziglar",
    "You don’t have to be great to start, but you have to start to be great. - Zig Ziglar",
    "People often say that motivation doesn’t last. Well, neither does bathing—that’s why we recommend it daily. - Zig Ziglar",
    "Either you run the day or the day runs you. - Jim Rohn",
    "Discipline is the bridge between goals and accomplishment. - Jim Rohn",
    "Motivation is what gets you started. Habit is what keeps you going. - Jim Ryun",
    "Champions keep playing until they get it right. - Billie Jean King",
    "You are capable of amazing things. - Unknown",
    "Be so good they can’t ignore you. - Steve Martin",
    "Work gives you meaning and purpose and life is empty without it. - Stephen Hawking",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Don’t wish it were easier. Wish you were better. - Jim Rohn",
    "Try not to become a person of success, but rather try to become a person of value. - Albert Einstein",
    "Life is like riding a bicycle. To keep your balance you must keep moving. - Albert Einstein",
    "Strive for progress, not perfection. - Unknown",
    "Success is the product of daily habits—not once-in-a-lifetime transformations. - James Clear",
    "You do not rise to the level of your goals. You fall to the level of your systems. - James Clear",
    "Habits are the compound interest of self-improvement. - James Clear",
    "Focus on being productive instead of busy. - Tim Ferriss",
    "What we fear doing most is usually what we most need to do. - Tim Ferriss",
    "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
    "Don’t let what you cannot do interfere with what you can do. - John Wooden",
    "Make each day your masterpiece. - John Wooden",
    "Success is peace of mind, which is a direct result of self-satisfaction. - John Wooden",
    "Fall seven times, stand up eight. - Japanese Proverb",
    "Even if you fall on your face, you’re still moving forward. - Victor Kiam",
    "Start small. Think big. Don’t worry about too many things at once. - Unknown",
    "One day or day one. You decide. - Unknown",
    "Your future is created by what you do today, not tomorrow. - Robert Kiyosaki",
    "Winners are not afraid of losing. But losers are. - Robert Kiyosaki",
    "The only place where success comes before work is in the dictionary. - Vidal Sassoon",
    "Success is getting what you want. Happiness is wanting what you get. - Dale Carnegie",
    "Most of the important things in the world have been accomplished by people who have kept on trying. - Dale Carnegie",
    "If you want to conquer fear, don’t sit home and think about it. Go out and get busy. - Dale Carnegie",
    "You miss 100% of the shots you don’t take. - Wayne Gretzky",
    "You can’t cross the sea merely by standing and staring at the water. - Rabindranath Tagore",
    "Everything has beauty, but not everyone sees it. - Confucius",
    "Our greatest glory is not in never falling, but in rising every time we fall. - Confucius",
    "Study the past if you would define the future. - Confucius",
    "If you can’t explain it simply, you don’t understand it well enough. - Albert Einstein",
    "Imagination is more important than knowledge. - Albert Einstein",
    "The only source of knowledge is experience. - Albert Einstein",
    "Be yourself; everyone else is already taken. - Oscar Wilde",
    "We are what we repeatedly do. Excellence, then, is not an act, but a habit. - Aristotle",
    "Quality is not an act, it is a habit. - Aristotle",
    "The secret of your future is hidden in your daily routine. - Mike Murdock",
    "The pain you feel today will be the strength you feel tomorrow. - Unknown",
    "Don’t downgrade your dream just to fit your reality. Upgrade your conviction to match your destiny. - Unknown",
    "Work hard, be kind, and amazing things will happen. - Conan O’Brien",
    "Never let success get to your head and never let failure get to your heart. - Unknown",
    "It always seems impossible until it’s done. - Nelson Mandela",
    "I never lose. Either I win or I learn. - Nelson Mandela",
    "After climbing a great hill, one only finds that there are many more hills to climb. - Nelson Mandela",
    "Do what you feel in your heart to be right—for you’ll be criticized anyway. - Eleanor Roosevelt",
    "No one can make you feel inferior without your consent. - Eleanor Roosevelt",
    "With the new day comes new strength and new thoughts. - Eleanor Roosevelt",
    "Do one thing every day that scares you. - Eleanor Roosevelt",
    "Be the change that you wish to see in the world. - Mahatma Gandhi",
    "Happiness is when what you think, what you say, and what you do are in harmony. - Mahatma Gandhi",
    "The best way to find yourself is to lose yourself in the service of others. - Mahatma Gandhi",
    "The future belongs to those who prepare for it today. - Malcolm X",
    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today. - Malcolm X",
    "If you want to lift yourself up, lift up someone else. - Booker T. Washington",
    "Associate yourself with people of good quality, for it is better to be alone than in bad company. - Booker T. Washington",
    "I am not a product of my circumstances. I am a product of my decisions. - Stephen R. Covey",
    "The main thing is to keep the main thing the main thing. - Stephen R. Covey",
    "Strength does not come from physical capacity. It comes from an indomitable will. - Mahatma Gandhi",
    "Don’t count the days, make the days count. - Muhammad Ali",
    "I hated every minute of training, but I said, ‘Don’t quit.’ - Muhammad Ali",
    "Service to others is the rent you pay for your room here on earth. - Muhammad Ali",
    "Believe in yourself and all that you are. - Christian D. Larson",
    "Keep your face always toward the sunshine—and shadows will fall behind you. - Walt Whitman",
    "You are never too old to set another goal or to dream a new dream. - C.S. Lewis",
    "Progress is impossible without change, and those who cannot change their minds cannot change anything. - George Bernard Shaw",
    "The man who moves a mountain begins by carrying away small stones. - Confucius",
    "If you don’t like something, change it. If you can’t change it, change your attitude. - Maya Angelou",
    "Nothing will work unless you do. - Maya Angelou",
    "You may encounter many defeats, but you must not be defeated. - Maya Angelou",
    "Everything you’ve ever wanted is on the other side of fear. - George Addair",
    "The future depends on what you do today. - Mahatma Gandhi",
    "Don’t be afraid to give up the good to go for the great. - John D. Rockefeller",
    "I find that the harder I work, the more luck I seem to have. - Thomas Jefferson",
    "If you can dream it, you can do it. - Walt Disney",
    "The way to get started is to quit talking and begin doing. - Walt Disney",
    "When you believe in a thing, believe in it all the way. - Walt Disney",
    "Failure is another stepping stone to greatness. - Oprah Winfrey",
    "Turn your wounds into wisdom. - Oprah Winfrey",
    "Surround yourself with only people who are going to lift you higher. - Oprah Winfrey",
    "The only person you are destined to become is the person you decide to be. - Ralph Waldo Emerson",
    "What lies behind us and what lies before us are tiny matters compared to what lies within us. - Ralph Waldo Emerson",
    "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. - Ralph Waldo Emerson",
    "Do not go where the path may lead, go instead where there is no path and leave a trail. - Ralph Waldo Emerson",
    "Don’t let yesterday take up too much of today. - Will Rogers",
    "Even if you’re on the right track, you’ll get run over if you just sit there. - Will Rogers",
    "Success is going from failure to failure without losing enthusiasm. - Winston Churchill",
    "Keep going. Everything you need will come to you at the perfect time. - Unknown",
    "Dream big and dare to fail. - Norman Vaughan",
    "Whether you think you can or you think you can’t, you’re right. - Henry Ford",
    "Start where you are. Use what you have. Do what you can. - Arthur Ashe",
    "It always seems impossible until it’s done. - Nelson Mandela",
    "Hard work beats talent when talent doesn’t work hard. - Tim Notke",
    "Do one thing every day that scares you. - Eleanor Roosevelt",
    "Opportunities don't happen. You create them. - Chris Grosser",
    "Discipline is the bridge between goals and accomplishment. - Jim Rohn",
    "Don’t limit your challenges. Challenge your limits. - Jerry Dunn",
    "The secret of getting ahead is getting started. - Mark Twain",
    "The expert in anything was once a beginner. - Helen Hayes",
    "Quality is not an act, it is a habit. - Aristotle",
    "Success usually comes to those who are too busy to be looking for it. - Henry David Thoreau",
    "You don’t have to be great to start, but you have to start to be great. - Zig Ziglar",
    "Motivation is what gets you started. Habit is what keeps you going. - Jim Ryun",
    "Failure is simply the opportunity to begin again, this time more intelligently. - Henry Ford",
    "A little progress each day adds up to big results. - Satya Nani",
    "Small deeds done are better than great deeds planned. - Peter Marshall",
    "The future depends on what you do today. - Mahatma Gandhi",
    "Don’t be pushed around by the fears in your mind. Be led by the dreams in your heart. - Roy T. Bennett",
    "Strive not to be a success, but rather to be of value. - Albert Einstein",
    "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
    "Fall seven times and stand up eight. - Japanese Proverb",
    "Believe in yourself and all that you are. - Christian D. Larson",
    "You become what you believe. - Oprah Winfrey",
    "Make each day your masterpiece. - John Wooden",
    "If you can dream it, you can do it. - Walt Disney",
    "Don’t count the days, make the days count. - Muhammad Ali",
    "Work hard in silence, let success make the noise. - Frank Ocean",
    "The way to get started is to quit talking and begin doing. - Walt Disney"
];

let currentQuoteIndex = 0; // Track current quote to avoid repeats

function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourDeg = ((hours % 12) + minutes / 60) * 30;
    const minuteDeg = (minutes + seconds / 60) * 6;
    const secondDeg = seconds * 6;

    const hourHand = document.querySelector('.hour');
    const minuteHand = document.querySelector('.minute');
    const secondHand = document.querySelector('.second');
    
    if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
    if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
}

function toggleLight() {
    const body = document.body;
    const content = document.querySelector('.content');
    if (content) {
        const isHidden = content.classList.toggle('hidden');
        body.style.backgroundColor = isHidden ? 'black' : '';
    }
}

function displayRandomQuote() {
    const quoteElement = document.querySelector('.quote');
    
    if (!quoteElement) {
        console.error('Quote element not found');
        return;
    }
    
    // Get a random index different from current one
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * quotes.length);
    } while (randomIndex === currentQuoteIndex && quotes.length > 1);
    
    currentQuoteIndex = randomIndex;
    
    // Add fade-out effect
    quoteElement.style.opacity = '0';
    quoteElement.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        quoteElement.textContent = quotes[randomIndex];
        quoteElement.style.opacity = '1';
        
        // Reinitialize Lucide icons after DOM update
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 300);
}

function shareQuote() {
    const quoteElement = document.querySelector('.quote');
    if (!quoteElement) return;
    
    const quoteText = quoteElement.textContent;
    
    if (navigator.share) {
        navigator.share({
            title: 'Inspirational Quote',
            text: quoteText
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(quoteText).then(() => {
            // Find the button that was clicked
            const shareButtons = document.querySelectorAll('.quote-btn');
            let btn = null;
            
            shareButtons.forEach(button => {
                if (button.textContent.includes('Share')) {
                    btn = button;
                }
            });
            
            if (!btn) return;
            
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="check" size="16"></i> Copied!';
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 2000);
        }).catch(err => console.log('Error copying:', err));
    }
}

setInterval(updateClock, 1000);

window.onload = function() {
    updateClock();
    displayRandomQuote();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};