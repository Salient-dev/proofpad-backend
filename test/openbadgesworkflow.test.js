const { expect } = require("chai");
const { ethers } = require("hardhat");
const convertToWei = (num) => ethers.utils.parseEther(num.toString());
const convertFromWei = (num) => ethers.utils.formatEther(num);

describe("OpenBadges Suite", function () {
  let owner, linkedIn, company2, jason, leootshudi, johndoe, nonMember, addr4, addrs;
  let ProfileManagerContract, ExperienceManagerContract, CompanyManagerContract, OpenBadgeFactory, CategoryManagerContract;
  let openbadge1Address, openbadge2Address;
  const STATUS_PENDING = 0;
  const STATUS_VERIFIED = 1;

  const OPENBADGE1_NAME = "Utilisation d'Excel";
  const OPENBADGE2_NAME = "Développement NodeJS";

  beforeEach(async function () {
    [owner, linkedIn, company2, jason, leootshudi, johndoe, nonMember, addr4, ...addrs] = await ethers.getSigners();

    // Deploy ProfileManager
    const OBManagerFactory = await ethers.getContractFactory("OpenBadgesProfileManager");
    ProfileManagerContract = await OBManagerFactory.deploy();
    await ProfileManagerContract.deployed();

    // Deploy CompanyManager
    const CompanyManagerFactory = await ethers.getContractFactory("CompanyManager");
    CompanyManagerContract = await CompanyManagerFactory.deploy();
    await CompanyManagerContract.deployed();

    // Deploy CategoryManager
    const CategoryManagerFactory = await ethers.getContractFactory("CategoryManager");
    CategoryManagerContract = await CategoryManagerFactory.deploy();
    await CategoryManagerContract.deployed();

    // Fetch OpenBadgeNFT
    OpenBadgeFactory = await ethers.getContractFactory("OpenBadge");

    // Deploy ExperienceManager
    const ExperienceManagerFactory = await ethers.getContractFactory("ExperienceManager");
    ExperienceManagerContract = await ExperienceManagerFactory.deploy(CompanyManagerContract.address, CategoryManagerContract.address, ProfileManagerContract.address);
    await ExperienceManagerContract.deployed();
  });

  describe(" I. DEPLOYMENTS", function() {
    it("Should have deployed ProfileManager", async() => {
        expect(ProfileManagerContract.address).to.not.equal(0);
        expect(await ProfileManagerContract.getOwner()).to.equal(owner.address);
    });

    it("Should have deployed CompanyManager", async() => {
        expect(CompanyManagerContract.address).to.not.equal(0);
    }); 

    it("Should have deployed CategoryManager", async() => {
        expect(CategoryManagerContract.address).to.not.equal(0);
    }); 

    it("Should have deployed ExperienceManager", async() => {
        expect(ExperienceManagerContract.address).to.not.equal(0);
    });
  })

  describe("\n    II. CATEGORIES", function() {
    it ("Should have deployed the default categories", async() => {
        const categories = await CategoryManagerContract.getCategories();
        expect(categories.length).to.equal(4);
    });
  })
  
  describe("\n   III. COMPANIES", function() {
    this.beforeEach(async() => {
        await CompanyManagerContract.connect(linkedIn).submitCompany("LinkedIn", "linkedInDidProfileURL.com");
    });

    it("Should allow a company to register", async() => {
        const companies = await CompanyManagerContract.getAllCompanies();
        expect(companies.length).to.equal(1);
    });

    it("Should set the company status to 'Pending' after registration", async() => {
        const company = await CompanyManagerContract.getCompany(linkedIn.address);
        expect(company.status).to.equal(STATUS_PENDING);
    });

    it("Should set the nft count to 0 after registration", async() => {
        const company = await CompanyManagerContract.getCompany(linkedIn.address);
        const nfts = await CompanyManagerContract.getNftContracts(linkedIn.address);
        expect(nfts.length).to.equal(0);
    });

    it("Should restrict the verification of a company to the owner", async() => {
        await expect(CompanyManagerContract.connect(linkedIn).verifyCompany(linkedIn.address)).to.be.reverted;
        const company = await CompanyManagerContract.getCompany(linkedIn.address);
        expect(company.status).to.equal(STATUS_PENDING);
    });
    
    it("Should set the company status to 'Verified' after verification", async() => {
        await CompanyManagerContract.connect(owner).verifyCompany(linkedIn.address);
        const company = await CompanyManagerContract.getCompany(linkedIn.address);
        expect(company.status).to.equal(STATUS_VERIFIED);
    });
  })

  describe("\n    IV. PROFILES", function() {
    this.beforeEach(async() => {
        await ProfileManagerContract.connect(jason).createProfile("jasonprofileURL.com", "attender")
    });

    it("Should allow anybody to create its own user profile", async() => {
        const profile = await ProfileManagerContract.connect(jason).getOwnProfile();
        expect(profile).to.not.equal(0);
        await ProfileManagerContract.connect(leootshudi).createProfile("leootshudiprofileURL.com", "attender");
        const allProfiles = await ProfileManagerContract.getAllProfiles();
        expect(allProfiles.length).to.equal(2);
    });

    it("Should add an organisation to the profile list and the CompanyManager", async() => {
      await ProfileManagerContract.connect(linkedIn).createProfile("linkedInDidProfileURL.com", "company");
      await CompanyManagerContract.connect(linkedIn).submitCompany("LinkedIn", "linkedInDidProfileURL.com");
      const linkedInProfile = await ProfileManagerContract.connect(linkedIn).getOwnProfile();
      expect(linkedInProfile).to.not.equal(0);
      const orgs = await ProfileManagerContract.connect(linkedIn).getAllOrganisations();
      expect(orgs.length).to.equal(1);
      const companies = await CompanyManagerContract.getAllCompanies();
      expect(companies.length).to.equal(1);
    });
  })

  describe("\n    IV. EXPERIENCES", function() {
    this.beforeEach(async() => {
      await CompanyManagerContract.connect(linkedIn).submitCompany("LinkedIn", "linkedInDidProfileURL.com");
      await CompanyManagerContract.connect(owner).verifyCompany(linkedIn.address);
      await ProfileManagerContract.connect(jason).createProfile("jasonprofileURL.com", "attender");
      console.log("linkedin", linkedIn.address)
      console.log("jason", jason.address);
      console.log("ownder", owner.address);
    })

    it("Should not allow a user to submit an experience in a non-existing company", async() => {
      await expect(ExperienceManagerContract.connect(jason).submitExperience("NonExistingCompany", 1, 1, "0x0000000000000000000000000000000000000000")).to.be.revertedWith("Company does not exist");
    });


    it("Should allow any user to submit an experience (to an existing company)", async() => {
      await expect(ExperienceManagerContract.connect(jason).submitExperience("Attended a course", 2, 0, linkedIn.address)).to.emit(ExperienceManagerContract, "ExperienceSubmitted");
      const userExp = await ExperienceManagerContract.getUserExperiences(jason.address);
      expect(userExp.length).to.equal(1);
    });

    it("Should set the experience validate status to false when submitted", async() => {
      await ExperienceManagerContract.connect(jason).submitExperience("Attended a course", 2, 0, linkedIn.address);
      const experience = await ExperienceManagerContract.getAllExperiences();
      expect (experience[0].validated).to.equal(false)
    });
    

    // it("Should only let the admin validate an experience", async() => {
    //   await ExperienceManagerContract.connect(jason).submitExperience("Attended a course", 2, 0, linkedIn.address);
    //   await expect(ExperienceManagerContract.connect(jason).validateExperience(0)).to.be.reverted;
    //   await expect(ExperienceManagerContract.connect(linkedIn).validateExperience(0)).to.emit(ExperienceManagerContract, "ExperienceValidated");
    //   // const experience = await ExperienceManagerContract.getAllExperiences()
    //   // expect(experience[0].validated).to.equal(true);
    // });

    it("Should create a new OpenBadge and mint a new OpenBadge NFT to the user when experience is validated (case user submitted an exp. that has not yet been created by company)", async() => {
      await ExperienceManagerContract.connect(jason).submitExperience("Attended a course", 2, 0, linkedIn.address);
      // Before the next function, we shall imagine that the company created a badgeClass JSON uploaded to IPFS at badgeclassURI.ipfs.com
      // The first 2 arguments ( badgeClass name and description) are entered by the company on the UI when validating the experience
      let tx = await ExperienceManagerContract.connect(linkedIn).createBadgeClass("Attend course", "Attend a course on Excel", "badgeclassURI.ipfs.com", 2, 0);
      tx = await tx.wait()
      // console.log(tx)
      const events = tx.events;
      const badgeClassCreatedEvent = events[1];
      const deployedContract = badgeClassCreatedEvent.args[0];
      console.log("Deployed contract: ", deployedContract);
      expect(deployedContract).to.not.equal(0);
      const userExp = (await ExperienceManagerContract.getAllExperiences())[0];
      console.log(userExp)
      const openBadgeContract = OpenBadgeFactory.attach(deployedContract);
      await openBadgeContract.connect(linkedIn).deliverBadge(userExp.userAddress, "openBadgeURI.ipfs.com")
      await ExperienceManagerContract.connect(linkedIn).validateExperienceForExistingBadge(0, deployedContract, "openBadgeURI.ipfs.com");
      await ProfileManagerContract.addReceivedOpenBadge(deployedContract, userExp.userAddress);
      
      const jasonsExperience = (await ProfileManagerContract.connect(jason).getOwnProfile()).openBadgesReceived;
      expect(jasonsExperience.length).to.equal(1);
      expect(jasonsExperience[0]).to.equal(deployedContract)
    });
  })
});