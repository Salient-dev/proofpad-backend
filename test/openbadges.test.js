const { expect } = require('chai');
const { ethers } = require('hardhat');
const convertToWei = (num) => ethers.utils.parseEther(num.toString());
const convertFromWei = (num) => ethers.utils.formatEther(num);
const OpenBadgeABI = require('../../src/artifacts/contracts/OpenBadge.sol/OpenBadge.json').abi;


describe("OpenBadges", function() {
    let euronixa;
    let OpenBadgeManagerContract;
    let openbadgeContract1Address;
    let openbadgeContract2Address;
    let company1Addr;
    let patrickdemelo, leootshudi, johndoe, addr4;
    let addrs;
    const OPENBADGE1_NAME = "JO"
    const OPENBADGE2_NAME = "NFT Paris"
    const OPENBADGE3_NAME = "GP Monaco"

    beforeEach(async function() {
        [euronixa, company1Addr, patrickdemelo, leootshudi, johndoe, addr4, ...addrs] = await ethers.getSigners();
        const OBManagerFactory = await ethers.getContractFactory('OpenBadgesProfileManager');
        OpenBadgeManagerContract = await OBManagerFactory.deploy();
        await OpenBadgeManagerContract.deployed();
    })

    describe("1. Rights and Privacy", function() {
        it("Should have deployed OpenBadgesProfileManager", async() => {
            console.log("\tOpenBadgeManagerContract address:", OpenBadgeManagerContract.address);
            expect(OpenBadgeManagerContract.address).to.not.equal(0);
            expect(await OpenBadgeManagerContract.getOwner()).to.equal(euronixa.address);
        })

        it("Should allow any person to create a profile (organisations + profiles)", async() => {
            console.log("");
            const beforeProfileCount = (await OpenBadgeManagerContract.getAllProfileAdresses()).length;
            await OpenBadgeManagerContract.createProfile("www.euronixa.io", "university");
            await OpenBadgeManagerContract.connect(patrickdemelo).createProfile("random-addr.eu", "Sportsman");
            await OpenBadgeManagerContract.connect(leootshudi).createProfile("random-addr2.eu", "Student");
            const profiles = await OpenBadgeManagerContract.getAllProfileAdresses();
            const afterProfileCount = profiles.length;
            // console.log("\tProfiles:", profiles);
            expect(afterProfileCount).to.equal(beforeProfileCount + 3);
            // console.log(await OpenBadgeManagerContract.getAllOrganisations());
            const organisationCount = (await OpenBadgeManagerContract.getAllOrganisations()).length;
            expect(organisationCount).to.equal(1);
        })
        
        it("Should add an Organisation to the Organisation list and Profiles list", async() => {
            console.log("");
            await OpenBadgeManagerContract.createProfile("www.euronixa.io", "university");
            await OpenBadgeManagerContract.connect(patrickdemelo).createProfile("random-addr.eu", "Sportsman");
            const profiles = await OpenBadgeManagerContract.getAllProfiles();
            // console.log("\tProfiles:", profiles);
            let organisationsInProfileList = profiles.filter(profile => profile.kind === "company" || profile.kind === "university" || profile.kind === "organisation");
            const organisationsInOrganisationList = await OpenBadgeManagerContract.getAllOrganisations();
            expect(organisationsInProfileList.length).to.equal(organisationsInOrganisationList.length);
        })

        it("Should not allow a person who has not created his profile to create a badge", async() => {
            console.log("");
            await expect(OpenBadgeManagerContract.addBadge("Random name", "Assist to the random test", "www.badge1.com")).to.be.revertedWith("Profile does not exist");
        })

        it("Should not allow a entity who created its profile but is not an organisation to create a badge...", async() => {
            console.log("");
            await OpenBadgeManagerContract.connect(patrickdemelo).createProfile("www.euronixa.io", "Sportsman");
            await expect(OpenBadgeManagerContract.connect(patrickdemelo).addBadge("Random name", "Assist to the random test", "www.badge1.com")).to.be.revertedWith("Only organisations can call this func");
        })

        it("... but should allow a person who has created his profile and is an organisation to create a badge", async() => {
            console.log("");
            await OpenBadgeManagerContract.connect(company1Addr).createProfile("www.euronixa.io", "university");
            await expect(OpenBadgeManagerContract.connect(company1Addr).addBadge("Random name", "Assist to the random test", "www.badge1.com")).not.to.be.reverted;
        })
    })

    describe("2. Badge Management", function() {
        beforeEach(async function() {
            await OpenBadgeManagerContract.connect(company1Addr).createProfile("www.euronixa.io", "company");
            let tx = await OpenBadgeManagerContract.connect(company1Addr).addBadge(OPENBADGE1_NAME, "Assist to the Olympic Games", "www.badge1.com");
            let res = await tx.wait();
            let deployementEvent = res.events[1];
            openbadgeContract1Address = deployementEvent.args[0];

            tx = await OpenBadgeManagerContract.connect(company1Addr).addBadge(OPENBADGE2_NAME, "Assist to NFT Paris", "www.badge2.com");
            res = await tx.wait();
            deployementEvent = res.events[1];
            openbadgeContract2Address = deployementEvent.args[0];
        })

        it("Should have deployed 2 badges", async() => {
            console.log("");
            console.log("\tBadge 1:", openbadgeContract1Address);
            console.log("\tBadge 2:", openbadgeContract2Address);
            expect(openbadgeContract1Address).to.not.equal(0);
            expect(openbadgeContract2Address).to.not.equal(0);
        })

        it("Should have a badge count of 2 assigned to the company1 address", async() => {
            console.log("");
            let company1Badges = await OpenBadgeManagerContract.connect(company1Addr).getOpenBadgeContracts();
            // console.log("\tCompany 1 badges:", company1Badges);
            const badgeCount = company1Badges.length;
            console.log("\tCompany1 Badge count:", badgeCount);
            expect(badgeCount).to.equal(2);
        })

        describe("\n\tOrganisation members management", function() {
            let addr1Profile;
            let OpenBadgeContract1;
            let OpenBadgeContract2;

            this.beforeEach(async function() {
                await OpenBadgeManagerContract.connect(patrickdemelo).createProfile("random-addr.eu", "Sportsman");
                await OpenBadgeManagerContract.connect(leootshudi).createProfile("random-addr2.eu", "Student");
                OpenBadgeContract1 = new ethers.Contract(openbadgeContract1Address, OpenBadgeABI, company1Addr);
                OpenBadgeContract2 = new ethers.Contract(openbadgeContract2Address, OpenBadgeABI, company1Addr);
                addr1Profile = await OpenBadgeManagerContract.connect(patrickdemelo).getOwnProfile();
            })

            it("Should not allow a person who is not an Organisation to add a member to its members list", async() => {
                console.log("");
                await expect(OpenBadgeManagerContract.connect(patrickdemelo).addMemberToOrganisation(leootshudi.address)).to.be.revertedWith("Only organisations can call this func");
            })

            it("Should allow an organisation to add a member to its members list", async() => {
                console.log("");
                await OpenBadgeManagerContract.connect(company1Addr).addMemberToOrganisation(patrickdemelo.address);
                await OpenBadgeManagerContract.connect(company1Addr).addMemberToOrganisation(leootshudi.address);
                const company1Members = await OpenBadgeManagerContract.connect(company1Addr).getOrganisationMembers();
                // console.log("\tCompany 1 members:", company1Members);
                expect(company1Members.length).to.equal(2);
            })
        })

        describe("\n\tBadge delivrance", function() {
            let addr1Profile;
            let OpenBadgeContract1;
            let OpenBadgeContract2;

            this.beforeEach(async function() {
                await OpenBadgeManagerContract.connect(patrickdemelo).createProfile("random-addr.eu", "Sportsman");
                await OpenBadgeManagerContract.connect(leootshudi).createProfile("random-addr2.eu", "Student");
                OpenBadgeContract1 = new ethers.Contract(openbadgeContract1Address, OpenBadgeABI, company1Addr);
                OpenBadgeContract2 = new ethers.Contract(openbadgeContract2Address, OpenBadgeABI, company1Addr);
                addr1Profile = await OpenBadgeManagerContract.connect(patrickdemelo).getOwnProfile();
            })

            it("Should not let a person who is not an Organisation to deliver a badge", async() => {
                console.log("");
                await expect(OpenBadgeContract1.connect(patrickdemelo).deliverBadge(patrickdemelo.address, "www.test.com")).to.be.reverted;
            })

            // it("Should not let an Organisation to deliver a badge to a person who is not part of its members", async() => {
            //     console.log("");
            //     await OpenBadgeManagerContract.connect(johndoe).createProfile("random-addr3.eu", "Sportsman");

            // })

            // it("Should let an Organisation to deliver a badge to a person", async() => {
            //     console.log("");
            //     // await OpenBadgeContract1.connect(company1Addr).deliverBadge(patrickdemelo.address, "www.test.com");
            //     expect(await OpenBadgeContract1.connect(company1Addr).deliverBadge(patrickdemelo.address, "www.test.com")).not.to.be.reverted;
            //     const patrickDeMeloBalance = await OpenBadgeContract1.getBalance(patrickdemelo.address);
            //     expect(patrickDeMeloBalance).to.equal(1);
            //     expect(await OpenBadgeContract1.connect(company1Addr).ownerOf(0)).to.equal(patrickdemelo.address);
            // })


            // it("Should have attributed a OpenBadge to addr1", async () => {
            //     console.log("\tProfile of addr1:", addr1Profile) ;
            // })
        })

        // it("Should allow an organisation to add a badge to a profile", async () => {
        //     console.log("");
        //     await OpenBadgeManagerContract.connect(company1Addr).addBadgeToProfile(patrickdemelo.address, openbadgeContract1Address.address);
        //     await OpenBadgeManagerContract.connect(company1Addr).addBadgeToProfile(leootshudi.address, openbadgeContract2Address.address);
        //     const profile1Badges = await OpenBadgeManagerContract.getProfileBadges(patrickdemelo.address);
        //     const profile2Badges = await OpenBadgeManagerContract.getProfileBadges(leootshudi.address);
        //     const profile3Badges = await OpenBadgeManagerContract.getProfileBadges(addr3.address);
        //     console.log("\tProfile 1 badges:", profile1Badges);
        //     console.log("\tProfile 2 badges:", profile2Badges);
        //     console.log("\tProfile 3 badges:", profile3Badges);
        //     expect(profile1Badges.length).to.equal(1);
        //     expect(profile2Badges.length).to.equal(1);
        //     expect(profile3Badges.length).to.equal(1);
        // })
    })
})