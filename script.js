(function(){
  function bindReliableTap(element, handler){
    if(!element) return;
    let suppressClickUntil = 0;

    element.addEventListener('touchend',(event)=>{
      if(event.cancelable) event.preventDefault();
      suppressClickUntil = Date.now() + 700;
      handler(event);
    },{passive:false});

    element.addEventListener('click',(event)=>{
      if(Date.now() < suppressClickUntil){
        event.preventDefault();
        return;
      }
      handler(event);
    });
  }

  const menuBtn=document.querySelector('.menu-toggle');
  const nav=document.querySelector('.nav');
  if(menuBtn&&nav){
    bindReliableTap(menuBtn,(event)=>{
      event.stopPropagation();
      const isOpen=nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded',String(isOpen));
    });
  }

  const widget=document.querySelector('.call-widget');
  const fab=document.querySelector('.call-fab');
  const callClose=document.querySelector('.call-panel-close');
  if(widget&&fab){
    bindReliableTap(fab,(event)=>{
      event.stopPropagation();
      const isOpen=widget.classList.toggle('open');
      fab.setAttribute('aria-expanded',String(isOpen));
    });

    if(callClose){
      bindReliableTap(callClose,(event)=>{
        event.stopPropagation();
        widget.classList.remove('open');
        fab.setAttribute('aria-expanded','false');
      });
    }

    document.addEventListener('click',(event)=>{
      if(!widget.contains(event.target)){
        widget.classList.remove('open');
        fab.setAttribute('aria-expanded','false');
      }
    });

    document.addEventListener('keydown',(event)=>{
      if(event.key==='Escape'){
        widget.classList.remove('open');
        fab.setAttribute('aria-expanded','false');
      }
    });

    document.querySelectorAll('.goods-call-trigger,.js-call-trigger').forEach((button)=>{
      bindReliableTap(button,(event)=>{
        event.preventDefault();
        event.stopPropagation();
        widget.classList.add('open');
        fab.setAttribute('aria-expanded','true');
      });
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
    bindReliableTap(button,()=>{
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
