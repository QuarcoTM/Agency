(function(){
  const menuBtn=document.querySelector('.menu-toggle');
  const nav=document.querySelector('.nav');
  if(menuBtn&&nav){
    menuBtn.addEventListener('click',()=>{
      const isOpen=nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded',String(isOpen));
    });
  }

  const widget=document.querySelector('.call-widget');
  const fab=document.querySelector('.call-fab');
  if(widget&&fab){
    fab.addEventListener('click',(e)=>{
      e.stopPropagation();
      const isOpen=widget.classList.toggle('open');
      fab.setAttribute('aria-expanded',String(isOpen));
    });
    document.addEventListener('click',(e)=>{
      if(!widget.contains(e.target)){
        widget.classList.remove('open');
        fab.setAttribute('aria-expanded','false');
      }
    });
    document.addEventListener('keydown',(e)=>{
      if(e.key==='Escape'){
        widget.classList.remove('open');
        fab.setAttribute('aria-expanded','false');
      }
    });
  }


  document.querySelectorAll('.nav a').forEach((link)=>{
    link.addEventListener('click',()=>{
      if(nav&&menuBtn){
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded','false');
      }
    });
  });

  document.querySelectorAll('.map-consent-button').forEach((button)=>{
    button.addEventListener('click',()=>{
      const holder=button.closest('.map-consent');
      if(!holder) return;
      const src=holder.getAttribute('data-map-src');
      if(!src) return;
      const iframe=document.createElement('iframe');
      iframe.title='Карта — Траурна агенция Ден и Нощ';
      iframe.src=src;
      iframe.loading='lazy';
      iframe.referrerPolicy='no-referrer-when-downgrade';
      iframe.allowFullscreen=true;
      holder.classList.remove('map-consent');
      holder.removeAttribute('data-map-src');
      holder.replaceChildren(iframe);
    });
  });

  const footer=document.querySelector('.site-footer');
  if(footer){
    const observer=new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(entry.isIntersecting){
          footer.classList.remove('footer-visible');
          void footer.offsetWidth;
          footer.classList.add('footer-visible');
        }else{
          footer.classList.remove('footer-visible');
        }
      });
    },{threshold:0.35});
    observer.observe(footer);
  }
})();
