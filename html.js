//load the moment library to can play with the date and hours
var moment = require('moment');
moment().format();



//---------- This is the function to render the html
function renderLayout(pageTitle, isLoggedIn, content, username, isCreatePage, isSignup, isLogin, isHomepage) {

    var html = `
    <!doctype>
    <html>
        <head>
            <title>${pageTitle}</title>
            <link rel='stylesheet' href='css/style.css'>

        </head>
        <body>
            <header>
                ${isLoggedIn ? renderLoggedinToolbar(username, isCreatePage, isHomepage) : renderLoggedoutToolbar(isSignup, isLogin, isHomepage)}
            </header>    
            <main>${content}
            </main> 
            <footer>&copy; 2016 Marie-Eve Gauthier
            </footer> 
        </body>
    </html>`;
    return html;
}

//----This is the function to render the html content of the homepage
function renderHomepage(posts, query){
    var listedPost = posts.map(function(post) {
        var score = post.voteScore;
        var timeSinceCreated = moment(post.post_createdAt).fromNow();
        return  `<li>
        <a href='/posts/${post.post_id}'>${post.post_title}</a>
        <p>Created by ${post.users_username}</p>
        <p>${timeSinceCreated}</p>
        <form action='/vote' method='post'>
          <input type='hidden' name='vote' value='1'>
          <input type='hidden' name='postId' value='${post.post_id}'>
          <button type='submit'>upvote this</button>
        </form>
        <p>${!score ? 0 : score}</p>
        <form action='/vote' method='post'>
          <input type='hidden' name='vote' value='-1'>
          <input type='hidden' name='postId' value='${post.post_id}'>
          <button type='submit'>downvote this</button>
        </form>
        </li>`;
    });
    var html = `
    <h1>Welcome to reddit-clone</h1>
    <h3>${query ? 'Thank you for voting!' : ''}</h3>
    <nav class='sortingMethod'>
        <ul>
            <li><a href='https://reddit-nodejs-api-marie-evegauthier.c9users.io/'>new</a></li>
            <li><a href='https://reddit-nodejs-api-marie-evegauthier.c9users.io/?sort=top'>top</a></li>
            <li><a href='https://reddit-nodejs-api-marie-evegauthier.c9users.io/?sort=hot'>hot</a></li>
            <li><a href='https://reddit-nodejs-api-marie-evegauthier.c9users.io/?sort=controversial'>controversial</a></li>
        </ul> 
    </nav> 
    <ul class='contents-list'>${listedPost.join('')}</ul>
    `;
    return html;
}

//This is the function to render the header if the user is loggedout. It is called inside the renderLayout function
function renderLoggedoutToolbar(isSignup, isLogin, isHomepage) {
    return `<nav class='signup-log'>
                ${isSignup ? '' : '<a href="/signup">Sign up</a>'}
                ${isLogin ? '' : '<a href="/login">Login</a>'}
                ${isHomepage ? '' : '<a href="/">Back to homepage</a>'}
            </nav>`;
}

//This is the function to render the header if the user is logged. It is called inside the renderLayout function
function renderLoggedinToolbar(user, isCreatePage, isHomepage) {
    return  `<nav class='signup-log'>
                <p>Hi ${user}!</p>
                ${isCreatePage ? '' : '<a href="/createPost">Submit a new post</a>'}
                <a href='/logout'>Logout</a>
                ${isHomepage ? '' : '<a href="/">Back to homepage</a>'}
            </nav>`;
}

//This function is called when the user press the login link in the homepage. It renders the layout to log in
function renderLoginForm() {
    return `<!doctype>
    <html>
        <head>
            <title>Log in</title>
            <link rel='stylesheet' href='css/style.css'>
        </head>
        <body>
            <main>
                <h1>Log in</h1>
                
                <form action="/login" method="POST"> 
                    <div>
                        <input type="text" name="username" placeholder="Enter your username">
                    </div>
                    <div>
                        <input type="text" name="password" placeholder="Enter your password">
                    </div>
                    <button type="submit">Login</button>
                </form>
            </main>    
        </body>
    </html>`;
}

function renderSignupForm() {
    return `<h1>Create an account</h1>
    <form action="/signup" method="POST"> 
        <div>
            <input type="text" name="username" placeholder="Enter your username">
        </div>
        <div>
            <input type="text" name="password" placeholder="Enter your password">
        </div>
        <button type="submit">Be part of reddit-clone!</button>
    </form>`;
}

function renderPost(post) {
    return `<article>
      <a href="${post.url}"><h1>${post.title}</h1></a>
      <p>Created by ${post.username}</p>
      <article>`;
}

function createPost() {
    return `<h1>Share with reddit-clone!</hi>
    <form action="/createPost" method="POST"> 
        <div>
            <input type="text" name="url" placeholder="Enter a URL to your post">
        </div>
        <div>
            <input type="text" name="title" placeholder="Enter the title of your post">
        </div>
        <button type="submit">Share your post!</button>
    </form>`;
}


module.exports = {
  renderLayout: renderLayout,
  renderHomepage: renderHomepage,
  renderLoggedoutToolbar: renderLoggedoutToolbar,
  renderLoggedinToolbar: renderLoggedinToolbar,
  renderLoginForm: renderLoginForm,
  renderSignupForm: renderSignupForm,
  renderPost: renderPost,
  createPost: createPost
};