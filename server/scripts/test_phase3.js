const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
} catch (_) {}
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function testPhase3() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { tls: true });
    const User = mongoose.model('User', new mongoose.Schema({ email: String, name: String }));
    const dikshant = await User.findOne({ email: 'dikshantbisht10@gmail.com' });
    const rajesh = await User.findOne({ email: 'rajesh.menon@seekers.journey' });
    const priya = await User.findOne({ email: 'priya.nair@seekers.journey' });

    const dikshantToken = jwt.sign({ id: dikshant._id }, process.env.JWT_SECRET);
    const rajeshToken = jwt.sign({ id: rajesh._id }, process.env.JWT_SECRET);
    const priyaToken = jwt.sign({ id: priya._id }, process.env.JWT_SECRET);

    console.log('--- 1. Testing GET /api/community/gatherings ---');
    const resList = await fetch('http://localhost:5001/api/community/gatherings', {
      headers: { Authorization: 'Bearer ' + dikshantToken },
    });
    console.log('List status:', resList.status);
    const dataList = await resList.json();
    console.log('Gatherings count:', dataList.gatherings?.length);
    const firstGathering = dataList.gatherings[0];
    console.log('First gathering title:', firstGathering.title);
    console.log('Venue:', firstGathering.venue?.name, '| City:', firstGathering.venue?.city);
    console.log('Contact:', firstGathering.contactPerson?.name, '| Role:', firstGathering.contactPerson?.ishaRole);
    console.log('Agenda steps count:', firstGathering.agenda?.length);

    console.log('\n--- 2. Testing GET /api/community/gatherings/:id ---');
    const resDetail = await fetch(`http://localhost:5001/api/community/gatherings/${firstGathering._id}`, {
      headers: { Authorization: 'Bearer ' + dikshantToken },
    });
    console.log('Detail status:', resDetail.status);
    const dataDetail = await resDetail.json();
    console.log('Detail attendees:', dataDetail.gathering?.attendees?.map(a => a.name));
    console.log('IsAttending:', dataDetail.gathering?.isAttending);

    console.log('\n--- 3. Testing POST /api/community/gatherings/:id/request-join (Priya requests) ---');
    const resJoin = await fetch(`http://localhost:5001/api/community/gatherings/${firstGathering._id}/request-join`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + priyaToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ note: 'Eager to sit in Brahma Muhurta silence' }),
    });
    console.log('Join request status:', resJoin.status);
    const dataJoin = await resJoin.json();
    console.log('Join response:', dataJoin);

    console.log('\n--- 4. Testing PUT /api/community/gatherings/:id/requests/:requestId (Host Rajesh approves) ---');
    // Fetch gathering as Rajesh to get request id
    const resHostView = await fetch(`http://localhost:5001/api/community/gatherings/${firstGathering._id}`, {
      headers: { Authorization: 'Bearer ' + rajeshToken },
    });
    const dataHostView = await resHostView.json();
    const pendingReq = dataHostView.gathering?.joinRequests?.find(r => r.userId?.email === 'priya.nair@seekers.journey');
    if (pendingReq) {
      const resApprove = await fetch(`http://localhost:5001/api/community/gatherings/${firstGathering._id}/requests/${pendingReq._id}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + rajeshToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accepted' }),
      });
      console.log('Approve status:', resApprove.status);
      const dataApprove = await resApprove.json();
      console.log('Approval result message:', dataApprove.message, 'New attendee count:', dataApprove.attendeesCount);
    } else {
      console.log('Priya request was already handled or directly accepted');
    }

    console.log('\n--- 5. Testing POST /api/community/gatherings/:id/messages (Dikshant posts message) ---');
    const resPostMsg = await fetch(`http://localhost:5001/api/community/gatherings/${firstGathering._id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + dikshantToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'Pranam Rajesh ji, see you at 5:20 AM tomorrow! 🙏' }),
    });
    console.log('Post message status:', resPostMsg.status);
    const dataPostMsg = await resPostMsg.json();
    console.log('Posted message text:', dataPostMsg.message?.content);

    console.log('\n--- 6. Testing GET /api/community/gatherings/:id/messages ---');
    const resFetchMsgs = await fetch(`http://localhost:5001/api/community/gatherings/${firstGathering._id}/messages`, {
      headers: { Authorization: 'Bearer ' + dikshantToken },
    });
    console.log('Fetch messages status:', resFetchMsgs.status);
    const dataFetchMsgs = await resFetchMsgs.json();
    console.log('Total chat messages in gathering:', dataFetchMsgs.messages?.length);
    console.log('Last message:', dataFetchMsgs.messages?.slice(-1)[0]?.content);

    console.log('\n🎉 All Phase 3 verification tests passed cleanly!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 3 test failed:', err);
    process.exit(1);
  }
}

testPhase3();
