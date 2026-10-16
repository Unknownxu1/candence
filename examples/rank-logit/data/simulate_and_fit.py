"""Reproducible simulated rank-ordered-logit analysis; entirely fictional ice-cream tasting; not empirical evidence.
Run from any directory: python path/to/simulate_and_fit.py. Needs numpy and scipy.
"""
from pathlib import Path
import itertools, json, csv, hashlib
import numpy as np
from scipy.interpolate import CubicSpline
from scipy.optimize import minimize
from scipy.special import logsumexp, expit
from scipy.stats import norm, chi2

OUT=Path(__file__).resolve().parent
SEED=7319
rng=np.random.default_rng(SEED)
N=1600
months=np.arange(25)
support=np.exp(-months/13)
m=rng.choice(months,N,p=support/support.sum())
active=rng.binomial(1,.46,N)
weight=float(active.mean())
KNOTS=np.array([0,6,12,18,24])
SPLINE=CubicSpline(KNOTS,np.eye(5),bc_type='natural',axis=0)
true_g=CubicSpline(KNOTS,np.array([.62,.18,-.22,-.31,-.38]),bc_type='natural')(m)
u=np.column_stack([true_g+.24*active,np.full(N,.28),np.full(N,-.12),np.zeros(N)])
rankings=np.argsort(-(u+rng.gumbel(size=(N,4))),axis=1)
events=['香草冰激淋','巧克力冰激淋','草莓冰激淋','抹茶冰激淋']

def basis(t,kind):
 t=np.atleast_1d(t).astype(float)
 if kind=='linear':return (t/12)[:,None]
 if kind=='piecewise':return np.column_stack([t/12,np.maximum(t-9,0)/12])
 return SPLINE(t)[:,1:]

def design(t,x,kind):
 t=np.atleast_1d(t);x=np.broadcast_to(x,t.shape)
 B=basis(t,kind);a=np.zeros((len(t),4,4+B.shape[1]))
 a[:,0,0]=1;a[:,0,1]=x;a[:,1,2]=1;a[:,2,3]=1;a[:,0,4:]=B
 return a

def likelihood(theta,X,R,hessian=False):
 orderedX=np.take_along_axis(X,R[:,:,None],axis=1)
 orderedU=orderedX@theta
 val=0.;grad=np.zeros(len(theta));H=np.zeros((len(theta),len(theta)))
 for stage in range(3):
  xr=orderedX[:,stage:,:];z=orderedU[:,stage:];lz=logsumexp(z,axis=1)
  p=np.exp(z-lz[:,None]);mean=np.einsum('na,nak->nk',p,xr)
  val+=np.sum(lz-z[:,0]);grad+=np.sum(mean-xr[:,0,:],axis=0)
  if hessian:H+=np.einsum('na,nak,nal->kl',p,xr,xr)-mean.T@mean
 return (float(val),grad,H) if hessian else (float(val),grad)

def fit(kind,idx):
 X=design(m[idx],active[idx],kind);R=rankings[idx]
 opt=minimize(likelihood,np.zeros(X.shape[-1]),args=(X,R),jac=True,method='BFGS',options={'gtol':1e-6,'maxiter':300})
 value,score,H=likelihood(opt.x,X,R,True)
 assert np.max(np.abs(score))<1e-4,(kind,opt.message,score)
 assert np.min(np.linalg.eigvalsh(H))>0
 return opt.x,np.linalg.inv(H),value,float(np.max(np.abs(score)))

def expected(t,theta,kind):
 """E[(4-rank)/3]*100 via pairwise PL probabilities; standardized active status."""
 total=0
 for x,w in [(0,1-weight),(1,weight)]:
  X=design([t],x,kind)[0];utilities=X@theta
  total+=w*100*np.mean(expit(utilities[0]-utilities[1:]))
 return float(total)

def derivative(t,theta,kind):
 step=1e-5;grad=[]
 for i in range(len(theta)):
  d=np.zeros(len(theta));d[i]=step
  grad.append((expected(t,theta+d,kind)-expected(t,theta-d,kind))/(2*step))
 return np.array(grad)

PERMS=list(itertools.permutations(range(4)))
def rank_distribution(t,theta,kind):
 probs=np.zeros(4)
 for x,w in [(0,1-weight),(1,weight)]:
  utilities=design([t],x,kind)[0]@theta
  for perm in PERMS:
   lp=0.
   for stage in range(3):lp+=utilities[perm[stage]]-logsumexp(utilities[list(perm[stage:])])
   probs[perm.index(0)]+=w*np.exp(lp)
 assert abs(probs.sum()-1)<1e-10
 return probs

def prediction(t,theta,cov,kind):
 mean=expected(t,theta,kind);g=derivative(t,theta,kind);se=float(np.sqrt(g@cov@g))
 row={'month':float(t),'mean':mean,'se':se,'lo':max(0,mean-1.96*se),'hi':min(100,mean+1.96*se)}
 if float(t).is_integer():
  p=rank_distribution(t,theta,kind);positions=np.array([0,100/3,200/3,100]);pr=p[::-1];cdf=np.cumsum(pr)
  low=float(positions[np.searchsorted(cdf,.025)]);high=float(positions[min(3,np.searchsorted(cdf,.975))])
  coverage=float(pr[(positions>=low)&(positions<=high)].sum())
  assert abs(mean-np.dot(p,[100,200/3,100/3,0]))<1e-9
  row.update({'rankProb':p.tolist(),'predictionLo':low,'predictionHi':high,'predictionCoverage':coverage,'n':int(np.sum(m==t))})
 return row

folds=np.array_split(rng.permutation(N),5)
models=[];fits={}
labels={'linear':'线性间隔天数','spline':'自然三次样条','piecewise':'连续分段线性'}
for kind in ['linear','spline','piecewise']:
 theta,cov,nll,score=fit(kind,np.arange(N));fits[kind]=(theta,cov)
 losses=[]
 for test in folds:
  train=np.setdiff1d(np.arange(N),test);th,_,_,_=fit(kind,train)
  losses.append(likelihood(th,design(m[test],active[test],kind),rankings[test])[0]/len(test))
 param_names=['香草口味常数（0天，非偏甜口味）','香草口味 × 偏甜口味参与者','巧克力冰激淋常数','草莓冰激淋常数']+({'linear':['间隔天数 / 12'],'piecewise':['间隔天数 / 12','max(间隔天数 − 9, 0) / 12'],'spline':['样条基 B₁（天）','样条基 B₂（天）','样条基 B₃（天）','样条基 B₄（天）']}[kind])
 params=[{'name':name,'estimate':float(v),'se':float(np.sqrt(cov[i,i])),'lo':float(v-1.96*np.sqrt(cov[i,i])),'hi':float(v+1.96*np.sqrt(cov[i,i])),'p':float(2*norm.sf(abs(v/np.sqrt(cov[i,i]))))} for i,(name,v) in enumerate(zip(param_names,theta))]
 model={'id':kind,'name':labels[kind],'k':len(theta),'logLik':-nll,'aic':2*len(theta)+2*nll,'cvNll':float(np.mean(losses)),'cvFoldSd':float(np.std(losses,ddof=1)),'cvFolds':losses,'maxScore':score,'parameters':params,'covariance':cov.tolist(),'curve':[prediction(t,theta,cov,kind) for t in np.linspace(0,24,97)]}
 g=derivative(12,theta,kind)-derivative(0,theta,kind);diff=expected(12,theta,kind)-expected(0,theta,kind);se=float(np.sqrt(g@cov@g))
 model['contrast12vs0']={'estimate':diff,'se':se,'lo':diff-1.96*se,'hi':diff+1.96*se,'p':float(2*norm.sf(abs(diff/se)))}
 g=derivative(24,theta,kind)-derivative(12,theta,kind);diff=expected(24,theta,kind)-expected(12,theta,kind);se=float(np.sqrt(g@cov@g))
 model['contrast24vs12']={'estimate':diff,'se':se,'lo':diff-1.96*se,'hi':diff+1.96*se,'p':float(2*norm.sf(abs(diff/se)))}
 models.append(model)
 print(kind,'k',len(theta),'LL',round(-nll,3),'AIC',round(model['aic'],3),'CV',round(model['cvNll'],4),flush=True)

best=min(x['aic'] for x in models)
for model in models:model['deltaAic']=model['aic']-best
lr=2*(models[1]['logLik']-models[0]['logLik']);df=models[1]['k']-models[0]['k']
bins=[{'start':a,'end':b-1,'n':int(np.sum((m>=a)&(m<b)))} for a,b in zip([0,3,6,9,12,15,18,21],[3,6,9,12,15,18,21,25])]
result={'simulation':True,'scenario':'fictional-ice-cream','timeUnit':'day','provenance':'Generated locally from RNG seed 7319; no external or company records','seed':SEED,'n':N,'nAlternatives':4,'informativeStages':N*3,'events':events,'activeShare':weight,'monthCounts':np.bincount(m,minlength=25).tolist(),'supportBins':bins,'tailN':int(np.sum(m>=18)),'models':models,'nonlinearityTest':{'statistic':lr,'df':df,'p':float(chi2.sf(lr,df))},'generation':{'knots':KNOTS.tolist(),'utilityAtKnots':[.62,.18,-.22,-.31,-.38],'activeEffect':.24,'competitorUtilities':[.28,-.12,0]},'inference':'Independent fictional tasters, observed-information covariance, pointwise delta-method CI; discrete equal-tail individual prediction interval.'}
(OUT/'analysis.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
with (OUT/'simulated-rankings.csv').open('w',encoding='utf-8-sig',newline='') as f:
 writer=csv.writer(f);writer.writerow(['taster_id','days_since_tasting','sweet_preference','rank_1','rank_2','rank_3','rank_4'])
 for i in range(N):writer.writerow([i+1,int(m[i]),int(active[i])]+[events[j] for j in rankings[i]])
print('12 vs 0',models[1]['contrast12vs0'],'LR',result['nonlinearityTest'],'tail n',result['tailN'],flush=True)
