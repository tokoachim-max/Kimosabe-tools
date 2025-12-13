
const donateBtn = document.getElementById('donateBtn');
const modal = document.getElementById('donateModal');
const closeDonate = document.getElementById('closeDonate');
if(donateBtn){
  donateBtn.onclick = ()=> modal.style.display='block';
  closeDonate.onclick = ()=> modal.style.display='none';
}
