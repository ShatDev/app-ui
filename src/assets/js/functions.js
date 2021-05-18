jQuery(function($){
	$(document).on("click", '.tabs .tab-links a', function(e)  {
        var currentAttrValue = jQuery(this).attr('href');
 
        // Show/Hide Tabs
		$('.tabs ' + currentAttrValue).slideDown(400).siblings().slideUp(400);
 
        // Change/remove current tab to active
		$(this).parent('li').addClass('active').siblings().removeClass('active');
 
        e.preventDefault();
	});

	//$('.staking-menu > li.parent > a').click(function () {
	//	$(this).parent('li').find('.staking-sub-menu').slideToggle();
	//});

	$(document).on("click", '.staking-menu > li.parent > a', function () {
		$(this).parent('li').find('.staking-sub-menu').slideToggle();
	});


	//$(document).on("click", 'input[name="theme"]', function () {
	//	if ($('#light').is(':checked')) {
	//		$('body').removeClass('dark');
	//	}
	//	if ($('#dark').is(':checked')) {
	//		$('body').addClass('dark');
	//	}
	//});

	$(document).on("click", '.menu-toggle', function () {
		//$('.menu-toggle').click(function () {
		$('.staking-menu').slideToggle();
	});

	//$(document).on("click", '.staking-pool .unstake-btn', function () {
	//	$(this).closest('.st-pool-inner').children('#unstake-wrap.unstake-wrap').animate({ 'bottom': '0px' });
	//});
	//$(document).on("click", '.staking-pool .cancel-btn', function () {
	//	$(this).parents('.staking-pool .unstake-wrap').animate({ 'bottom': '-100%' });
	//});
	//$(document).on("click", '.staking-pool .stake-btn', function () {
	//	$(this).closest('.st-pool-inner').children('#stake-wrap.unstake-wrap').animate({ 'bottom': '0px' });
	//});
});



