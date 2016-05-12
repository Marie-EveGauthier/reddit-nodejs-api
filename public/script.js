/* global $ */
$(document).ready(function() {
    $('.upvote').on('submit', function(event) {
        event.preventDefault();
        var $this = $(this);
        var data = $this.serializeArray();
        var dataObj = {postId: data[1].value, vote: data[0].value};
        $.post('/vote', dataObj, 
            function(response) {
                if(typeof response === 'string') {
                    $(`#message${dataObj.postId}`).text(response);
                }
                else {
                    $(`#vote${dataObj.postId}`).text(response.result);
                }
            }
        );
    });
    
    $('.downvote').on('submit', function(event){
        event.preventDefault();
        var $this = $(this);
        var data = $this.serializeArray();
        var dataObj = {postId: data[1].value, vote: data[0].value};
        $.post(
            '/vote', dataObj,
            function(response) {
                if(typeof response === 'string') {
                    $(`#message${dataObj.postId}`).text(response);
                }
                else {
                    $(`#vote${dataObj.postId}`).text(response.result);
                }
            }
        );
    });
});