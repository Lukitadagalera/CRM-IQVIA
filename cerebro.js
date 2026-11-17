/* ===== CÉREBRO: inteligência, animação e tempo real ===== */
(function(){
const R=v=>'R$ '+(v>=1e9?(v/1e9).toFixed(2).replace('.',',')+' Bi':(v/1e6).toFixed(1).replace('.',',')+' Mi');
const P=v=>(v>=0?'+':'')+v.toFixed(1).replace('.',',')+'%';
const Y=['Jun22','Jun23','Jun24','Jun25','Jun26'];
const rows=(D.matTrendDual||[]).map(r=>{const s=Y.map(y=>r['MAT_'+y+'_Reais']||0),u=Y.map(y=>r['MAT_'+y+'_Unid']||0);
  const yoy=s[3]?(s[4]/s[3]-1)*100:0,cagr=s[0]?(Math.pow(s[4]/s[0],1/4)-1)*100:0,prevYoy=s[2]?(s[3]/s[2]-1)*100:0,
  uy=u[3]?(u[4]/u[3]-1)*100:0,price=(u[4]&&u[3])?((s[4]/u[4])/(s[3]/u[3])-1)*100:0;
  return {m:r.Molecula,s,yoy,cagr,accel:yoy-prevYoy,uy,price,last:s[4]};});
const tot=rows.reduce((a,r)=>a+r.last,0), totPrev=rows.reduce((a,r)=>a+r.s[3],0);
const by=(k,d)=>rows.slice().sort((a,b)=>d*(b[k]-a[k]));

/* Insights */
const top=by('yoy',1)[0],worst=by('yoy',-1)[0],big=by('last',1)[0],acc=by('accel',1)[0];
const shares=rows.map(r=>r.last/tot*100),hhi=shares.reduce((a,x)=>a+x*x,0);
const top3=by('last',1).slice(0,3).reduce((a,r)=>a+r.last,0)/tot*100;
const growing=rows.filter(r=>r.yoy>0);
const ins=[
 `Portfólio movimenta <b>${R(tot)}</b> no MAT Jun/26, ${P((tot/totPrev-1)*100)} vs. ano anterior.`,
 `<b>${top.m}</b> lidera o crescimento (${P(top.yoy)}); <b>${worst.m}</b> tem a maior queda (${P(worst.yoy)}).`,
 `<b>${big.m}</b> é a maior molécula, com ${(big.last/tot*100).toFixed(0)}% da receita — as 3 maiores somam ${top3.toFixed(0)}%.`,
 `Maior aceleração: <b>${acc.m}</b> (+${acc.accel.toFixed(1).replace('.',',')} p.p. no ritmo de crescimento).`,
 `${growing.length} de ${rows.length} moléculas crescem; concentração (HHI) em ${hhi.toFixed(0)} — ${hhi>2500?'alta, risco de dependência':hhi>1500?'moderada':'saudável e diversificada'}.`
];
document.getElementById('ccInsights').innerHTML=ins.map((t,i)=>`<li style="--d:${i}">${t}</li>`).join('');

/* Alertas */
const al=[];
rows.forEach(r=>{
 if(r.uy>5&&r.price<-5) al.push(['warn',`<b>${r.m}</b>: volume ${P(r.uy)} mas preço médio ${P(r.price)} — erosão de preço.`]);
 if(r.yoy<-5) al.push(['bad',`<b>${r.m}</b>: receita em queda de ${P(r.yoy)} no último ano.`]);
 if(r.yoy>10&&r.accel>0) al.push(['good',`<b>${r.m}</b>: crescimento acelerando (${P(r.yoy)}) — oportunidade de investimento.`]);
 if(r.cagr<0&&r.yoy>0) al.push(['info',`<b>${r.m}</b>: sinal de recuperação após CAGR negativo (${P(r.cagr)}).`]);
});
const ic={good:'▲',bad:'▼',warn:'!',info:'↻'};
document.getElementById('ccAlerts').innerHTML=al.slice(0,7).map((a,i)=>`<li class="al ${a[0]}" style="--d:${i}"><i>${ic[a[0]]}</i><span>${a[1]}</span></li>`).join('')||'<li>Nenhum alerta.</li>';

/* Saúde (gauge) */
const health=Math.max(0,Math.min(100,Math.round(50+(tot/totPrev-1)*300+(growing.length/rows.length-.5)*60-(hhi>2500?10:0))));
const css=getComputedStyle(document.body);
function gauge(){const g=echarts.init(document.getElementById('healthGauge'));
 g.setOption({series:[{type:'gauge',startAngle:210,endAngle:-30,min:0,max:100,radius:'100%',progress:{show:true,width:10,roundCap:true,itemStyle:{color:{type:'linear',x:0,y:0,x2:1,y2:0,colorStops:[{offset:0,color:'#E0A030'},{offset:1,color:'#14C98A'}]}}},
 axisLine:{lineStyle:{width:10,color:[[1,'rgba(127,127,127,.15)']]}},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},pointer:{show:false},
 detail:{valueAnimation:true,fontSize:26,fontWeight:800,offsetCenter:[0,'5%'],color:'#fff',formatter:'{value}'},data:[{value:health}],animationDuration:2200}]});
 window.addEventListener('resize',()=>g.resize());}
gauge();

/* Sparklines */
const sg=document.getElementById('sparkGrid');
by('last',1).forEach(r=>{const d=document.createElement('div');d.className='spark';d.title='Filtrar '+r.m;
 d.innerHTML=`<div class="sp-top"><b>${r.m}</b><span class="${r.yoy>=0?'up':'dn'}">${P(r.yoy)}</span></div><div class="sp-val">${R(r.last)}</div><div class="sp-ch"></div>`;
 sg.appendChild(d);
 const c=echarts.init(d.querySelector('.sp-ch')),col=r.yoy>=0?'#14C98A':'#E5604D';
 c.setOption({grid:{left:0,right:0,top:4,bottom:0},xAxis:{type:'category',show:false,data:Y},yAxis:{show:false,scale:true},tooltip:{trigger:'axis',valueFormatter:R},
  series:[{type:'line',data:r.s,smooth:true,symbol:'circle',symbolSize:4,lineStyle:{width:2,color:col},itemStyle:{color:col},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:col+'55'},{offset:1,color:col+'00'}]}},animationDuration:1800}]});
 window.addEventListener('resize',()=>c.resize());
 d.addEventListener('click',()=>{setMolSel([r.m]);renderAll();toast('Filtro aplicado: '+r.m+' (clique em Todas para voltar)');
  document.getElementById('kpiRow').scrollIntoView({behavior:'smooth',block:'center'});});
});

/* Simulador */
const up=document.getElementById('simUp'),dn=document.getElementById('simDn');
function sim(){const a=+up.value,b=+dn.value;document.getElementById('simUpV').textContent=(a>0?'+':'')+a+'%';document.getElementById('simDnV').textContent=(b>0?'+':'')+b+'%';
 const proj=rows.reduce((s,r)=>s+r.last*(1+(r.yoy>=0?a:b)/100),0);
 document.getElementById('simBase').textContent=R(tot);countTo(document.getElementById('simProj'),proj,R);
 const dl=document.getElementById('simDelta');dl.textContent=P((proj/tot-1)*100);dl.className=proj>=tot?'up':'dn';}
up.oninput=dn.oninput=sim;up.value=Math.round(growing.reduce((s,r)=>s+r.yoy,0)/Math.max(1,growing.length));sim();

/* Count-up */
function countTo(el,target,fmt){const st=performance.now(),from=el._v||0;el._v=target;
 (function f(t){const k=Math.min(1,(t-st)/900),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(target-from)*e);if(k<1)requestAnimationFrame(f);})(st);}
let busy=false;
function animateKpis(){busy=true;let n=0;document.querySelectorAll('.kpi-value').forEach(el=>{const txt=el.textContent.trim(),m=txt.match(/-?[\d.,]*\d/);if(!m)return;
 const num=parseFloat(m[0].replace(',','.')),dec=(m[0].split(/[.,]/)[1]||'').length,pre=txt.slice(0,m.index),suf=txt.slice(m.index+m[0].length),st=performance.now();n++;
 (function f(t){const k=Math.min(1,(t-st)/1100),e=1-Math.pow(1-k,3);el.textContent=k<1?pre+(num*e).toFixed(dec)+suf:txt;if(k<1)requestAnimationFrame(f);else if(--n===0)setTimeout(()=>busy=false,50);})(st);
 const c=el.closest('.kpi-card');c&&(c.classList.add('flash'),setTimeout(()=>c.classList.remove('flash'),900));});if(!n)busy=false;}
const kr=document.getElementById('kpiRow');new MutationObserver(()=>{if(busy)return;clearTimeout(kr._t);kr._t=setTimeout(animateKpis,30);}).observe(kr,{childList:true});animateKpis();

/* Revelação ao rolar */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.08});
document.querySelectorAll('.chart-card,.kpi-card,.invest-card,.table-card,.ceo-card,.exec-card,.cc-card').forEach((el,i)=>{el.classList.add('reveal');el.style.setProperty('--i',i%6);io.observe(el);});

/* Barra de progresso + relógio */
addEventListener('scroll',()=>{const h=document.documentElement;document.getElementById('scrollProgress').style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';},{passive:true});
const ck=document.getElementById('liveClock');(function t(){ck.textContent=new Date().toLocaleString('pt-BR',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'});setTimeout(t,1000);})();

/* Toast */
function toast(msg){let t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.classList.add('show'),10);setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400)},2600);}

/* Modo apresentação: tela cheia + navegação por seções (setas / espaço) */
const secs=()=>[...document.querySelectorAll('.hero,#commandCenter,.exec-summary,#kpiRow,.ceo-wrap,section.invest-wrap,section.chart-grid,.table-wrap')].filter(s=>s.offsetParent);
let idx=0,on=false;
function go(i){const s=secs();idx=Math.max(0,Math.min(s.length-1,i));s[idx].scrollIntoView({behavior:'smooth',block:'start'});s.forEach(x=>x.classList.remove('spot'));s[idx].classList.add('spot');}
function toggle(){on=!on;document.body.classList.toggle('presenting',on);
 if(on){document.documentElement.requestFullscreen?.().catch(()=>{});go(0);toast('Modo apresentação: use ← → ou espaço · Esc para sair');}
 else{document.fullscreenElement&&document.exitFullscreen();secs().forEach(x=>x.classList.remove('spot'));}
 document.getElementById('presentBtn').textContent=on?'■ Sair':'▶ Apresentar';}
document.getElementById('presentBtn').onclick=toggle;
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
 if(e.key==='p'||e.key==='P')toggle();
 if(!on)return;if(['ArrowRight','ArrowDown',' ','PageDown'].includes(e.key)){e.preventDefault();go(idx+1);}
 if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(idx-1);}
 if(e.key==='Escape'&&on)toggle();});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&on)toggle();});
})();
