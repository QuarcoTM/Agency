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
