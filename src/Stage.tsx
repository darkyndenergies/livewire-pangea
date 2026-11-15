import React, {ReactElement, useEffect, useState} from 'react';
import {StageBase, StageResponse, InitialData, Message} from '@chub-ai/stages-ts';
import {LoadResponse} from '@chub-ai/stages-ts/dist/types/load';

type Viewer = {name:string; alien:boolean};
type Comment = {id:number; user:string; alien:boolean; text:string};
type Profile = {name:string; favorability:number; entertainment:number; controversy:number; attention:number; featured:boolean};
type State = {queue:Comment[]; visible:Comment[]; profiles:Profile[]; showApproval:number; engagement:number; nextId:number; lastScene:string};
type Config = {humanPercent?:number; commentIntervalMs?:number};
const INITIAL: State = {queue:[],visible:[],profiles:[],showApproval:65,engagement:40,nextId:1,lastScene:'Waiting for broadcast'};
const humans=['couchrot','messyboots','islandupdates','frootloops','trashTVqueen','notbuyingit','late2theparty','screentime','sundaysinner'];
const aliens=['Veyr-77','thessari','Orrix','Nim-of-Tides','keth.4'];
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
function analyze(content:string, previous:State, humanPercent:number):State {
  const s:State={...previous,queue:[...previous.queue],visible:[...previous.visible],profiles:previous.profiles.map(p=>({...p}))};
  const clean=content.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(!clean)return s;
  const privateScene=/\b(off.camera|unobserved|no cameras|not being broadcast|private thoughts?|internal monologue)\b/i.test(clean);
  if(privateScene){s.lastScene='Scene visibility uncertain / possibly private';return s;}
  const dramatic=/\b(shout|scream|fight|slap|punch|betray|kiss|cry|stole|steal|blood|confess|argu|threat|caught|secret)\w*/i.test(clean);
  const names=[...clean.matchAll(/\b([A-Z][a-z]{2,})\b/g)].map(m=>m[1]).filter(n=>!['The','This','That','When','Then','There','After','Before','What','They','She','His','Her','And','But','Pangea'].includes(n));
  const counts=new Map<string,number>();names.forEach(n=>counts.set(n,(counts.get(n)||0)+1));
  const known=s.profiles.map(p=>p.name);
  const target=[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]).find(n=>known.includes(n)) || [...counts.keys()][0];
  if(target){let p=s.profiles.find(p=>p.name===target);if(!p && s.profiles.length<30){p={name:target,favorability:50,entertainment:50,controversy:30,attention:15,featured:false};s.profiles.push(p);}if(p){p.attention=clamp(p.attention+(dramatic?15:5));p.entertainment=clamp(p.entertainment+(dramatic?4:1));p.controversy=clamp(p.controversy+(dramatic?5:0));}}
  s.engagement=clamp(s.engagement+(dramatic?12:2));
  const subject=target||'this situation';
  const lines=dramatic?[
    `NO WAY that just happened 💀`,`${subject} is about to be all over the feeds`,
    `chat I need someone to explain what I just watched`,`this island is NEVER boring`,
    `I feel like we're missing context here`,`oh this is going to start a whole argument`,
    `The social dynamics of this habitat are fascinating.`,`I have watched for 19 cycles and this is still surprising.`
  ]:[
    `not me getting invested in ${subject} again`,`the background drama is always better than the main conversation`,
    `anyone else been watching all morning?`,`I swear every time I check this feed something changes`,
    `These humans are unusually compelling.`,`I wonder if Pangea anticipated this interaction.`
  ];
  const count=dramatic?10:6;
  for(let i=0;i<count;i++){
    const alien=(i%4===3); // exact 25% over every complete four-comment block
    const pool=alien?aliens:humans;
    const user=pool[(s.nextId+i*3)%pool.length];
    const text=lines[(s.nextId+i)%lines.length];
    s.queue.push({id:s.nextId++,user,alien,text});
  }
  s.queue=s.queue.slice(-70);s.lastScene=dramatic?'Elevated audience activity':'Steady broadcast';
  return s;
}
function LiveWireUI({stage}:{stage:Stage}){
  const [data,setData]=useState<State>({...stage.data});
  const [tab,setTab]=useState<'chat'|'pulse'|'settings'>('chat');
  const [paused,setPaused]=useState(false);
  useEffect(()=>stage.subscribe(setData),[stage]);
  useEffect(()=>{if(paused)return;const t=setInterval(()=>stage.releaseComment(),stage.interval);return()=>clearInterval(t);},[stage,paused]);
  const card:React.CSSProperties={background:'#1c2030',padding:12,borderRadius:10};
  const button:React.CSSProperties={background:'#30364c',border:'none',color:'#f4f3fa',padding:'8px 10px',borderRadius:8,cursor:'pointer'};
  return <div style={{background:'#10131e',color:'#f1f0f7',fontFamily:'system-ui,sans-serif',padding:14,minHeight:'100vh',boxSizing:'border-box',fontSize:13}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><strong><span style={{background:'#e43c60',padding:'4px 7px',borderRadius:5,marginRight:8}}>● LIVE</span> LIVEWIRE</strong><span style={{color:'#b2b6c8'}}>PANGEA FEED</span></header>
    <div style={{...card,marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between'}}><span>{data.lastScene}</span><span>75% Earth · 25% Alien</span></div><div style={{marginTop:9,color:'#b8bad0'}}>Engagement: {data.engagement}/100 · {data.queue.length} queued</div></div>
    <nav style={{display:'flex',gap:6,marginBottom:10}}>{(['chat','pulse','settings'] as const).map(x=><button key={x} style={{...button,background:tab===x?'#7256a5':'#30364c',flex:1}} onClick={()=>setTab(x)}>{x==='chat'?'Live chat':x==='pulse'?'Audience pulse':'Controls'}</button>)}</nav>
    {tab==='chat'&&<><div style={{...card,height:330,overflowY:'auto',display:'flex',flexDirection:'column',gap:11}}>{data.visible.length===0?<span style={{color:'#a9adc0'}}>Awaiting broadcast reactions…</span>:data.visible.map(c=><div key={c.id}><strong style={{color:c.alien?'#c7a8f5':'#9dcbe9'}}>{c.user}</strong><small style={{color:'#8f96ae',marginLeft:7}}>{c.alien?'ALIEN · translated':'EARTH'}</small><div style={{marginTop:3}}>{c.text}</div></div>)}</div><div style={{display:'flex',gap:8,marginTop:9}}><button style={button} onClick={()=>setPaused(v=>!v)}>{paused?'Resume feed':'Pause feed'}</button><button style={button} onClick={()=>stage.releaseComment()}>Next comment</button></div></>}
    {tab==='pulse'&&<div style={{display:'grid',gap:9}}><div style={card}>Show approval: <strong>{data.showApproval}/100</strong><br/>Engagement: <strong>{data.engagement}/100</strong></div>{data.profiles.map(p=><div key={p.name} style={card}><div style={{display:'flex',justifyContent:'space-between'}}><strong>{p.name}</strong><small>{p.featured?'FEATURED':'DISCOVERED'}</small></div><div style={{margin:'8px 0'}}>Favorability {p.favorability} · Entertainment {p.entertainment} · Controversy {p.controversy} · Attention {p.attention}</div><button style={button} onClick={()=>stage.adjust(p.name,10)}>Favorability +10</button> <button style={button} onClick={()=>stage.adjust(p.name,-10)}>−10</button> <button style={button} onClick={()=>stage.feature(p.name)}>{p.featured?'Unfeature':'Feature'}</button></div>)}</div>}
    {tab==='settings'&&<div style={{...card,display:'grid',gap:10}}><label>Register important islander <input id="lw-name" placeholder="Character name" style={{padding:8,marginLeft:8,maxWidth:'55%'}}/></label><button style={button} onClick={()=>{const el=document.getElementById('lw-name') as HTMLInputElement|null;if(el?.value.trim()){stage.register(el.value.trim());el.value='';}}}>Register islander</button><label>Show approval <input type="range" min="0" max="100" value={data.showApproval} onChange={e=>stage.setApproval(Number(e.target.value))}/>{data.showApproval}</label><p style={{color:'#abb0c4'}}>Broadcast visibility: inferred. Scenes explicitly described as off-camera or private are excluded from the simple comment generator. Review ambiguous cases manually.</p><button style={button} onClick={()=>stage.clearQueue()}>Clear queued comments</button></div>}
    <footer style={{color:'#868da6',marginTop:12,fontSize:11}}>v0.1 · Local heuristic reactions · AI generation not connected</footer>
  </div>;
}
export class Stage extends StageBase<null,null,State,Config>{
  data:State; interval:number; listeners=new Set<(s:State)=>void>();
  constructor(init:InitialData<null,null,State,Config>){super(init);this.data={...INITIAL,...(init.messageState||{})};this.interval=Math.max(1000,init.config?.commentIntervalMs||4500);}
  subscribe(fn:(s:State)=>void){this.listeners.add(fn);fn({...this.data});return()=>{this.listeners.delete(fn);};}
  publish(){this.listeners.forEach(fn=>fn({...this.data,queue:[...this.data.queue],visible:[...this.data.visible],profiles:[...this.data.profiles]}));}
  releaseComment(){if(!this.data.queue.length)return;this.data.queue=this.data.queue.slice();this.data.visible=[...this.data.visible,this.data.queue.shift()!].slice(-90);this.publish();}
  adjust(name:string,delta:number){this.data.profiles=this.data.profiles.map(p=>p.name===name?{...p,favorability:clamp(p.favorability+delta)}:p);this.publish();}
  feature(name:string){this.data.profiles=this.data.profiles.map(p=>p.name===name?{...p,featured:!p.featured}:p);this.publish();}
  register(name:string){if(!this.data.profiles.some(p=>p.name.toLowerCase()===name.toLowerCase()))this.data.profiles=[...this.data.profiles,{name,favorability:50,entertainment:50,controversy:30,attention:10,featured:true}];this.publish();}
  setApproval(n:number){this.data.showApproval=clamp(n);this.publish();}
  clearQueue(){this.data.queue=[];this.publish();}
  async load():Promise<Partial<LoadResponse<null,null,State>>>{return {success:true,error:null,initState:null,chatState:null};}
  async setState(state:State):Promise<void>{this.data={...INITIAL,...(state||{})};this.publish();}
  async beforePrompt(_message:Message):Promise<Partial<StageResponse<null,State>>>{return {stageDirections:null,messageState:this.data,modifiedMessage:null,systemMessage:null,error:null,chatState:null};}
  async afterResponse(message:Message):Promise<Partial<StageResponse<null,State>>>{this.data=analyze(message.content||'',this.data,75);this.publish();return {stageDirections:null,messageState:this.data,modifiedMessage:null,systemMessage:null,error:null,chatState:null};}
  render():ReactElement{return <LiveWireUI stage={this}/>;}
}
